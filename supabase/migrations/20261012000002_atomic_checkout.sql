-- Deploy together with the updated frontend. No OAuth/PWA changes.
BEGIN;
ALTER TABLE public.orders ADD COLUMN checkout_key uuid;
ALTER TABLE public.orders ADD COLUMN stock_reserved boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN purchase_counted boolean NOT NULL DEFAULT false;
UPDATE public.orders SET purchase_counted = true WHERE status IN ('validated','delivered');
CREATE UNIQUE INDEX orders_checkout_key_unique ON public.orders(user_id, checkout_key);
CREATE OR REPLACE FUNCTION public.checkout_cart(p_request_id uuid, p_notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 uid uuid := auth.uid(); prof public.profiles%ROWTYPE; oid uuid;
 cart jsonb; item jsonb; prod public.products%ROWTYPE;
 amount numeric := 0; unit numeric; qty integer; result jsonb;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 IF p_request_id IS NULL THEN RAISE EXCEPTION 'REQUEST_REQUIRED'; END IF;
 IF length(coalesce(p_notes,'')) > 500 THEN RAISE EXCEPTION 'NOTES_TOO_LONG'; END IF;
 -- Serialize checkouts by this user and protect subscription reads.
 SELECT * INTO prof FROM public.profiles WHERE user_id = uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'PROFILE_REQUIRED'; END IF;
 SELECT id INTO oid FROM public.orders WHERE user_id = uid AND checkout_key = p_request_id;
 IF oid IS NULL THEN
   SELECT jsonb_agg(to_jsonb(c)) INTO cart FROM
     (SELECT id, product_id, quantity FROM public.cart_items WHERE user_id = uid ORDER BY product_id FOR UPDATE) c;
   IF cart IS NULL THEN RAISE EXCEPTION 'CART_EMPTY'; END IF;
   IF jsonb_array_length(cart) > 100 THEN RAISE EXCEPTION 'CART_TOO_LARGE'; END IF;
   -- Product locks are acquired in stable order across buyers.
   FOR item IN SELECT value FROM jsonb_array_elements(cart) LOOP
     SELECT * INTO prod FROM public.products WHERE id = (item->>'product_id')::uuid FOR UPDATE;
     IF NOT FOUND OR NOT prod.is_active THEN RAISE EXCEPTION 'PRODUCT_UNAVAILABLE'; END IF;
     IF (CASE prof.plan WHEN 'premium' THEN 2 WHEN 'medium' THEN 1 ELSE 0 END) <
        (CASE prod.required_plan WHEN 'premium' THEN 2 WHEN 'medium' THEN 1 ELSE 0 END) THEN
       RAISE EXCEPTION 'PLAN_REQUIRED';
     END IF;
     qty := (item->>'quantity')::integer;
     IF qty < 1 OR qty > prod.stock THEN RAISE EXCEPTION 'STOCK_INSUFFICIENT'; END IF;
     unit := least(prod.price, coalesce(prod.discounted_price,prod.price));
     amount := amount + unit * qty;
   END LOOP;
   INSERT INTO public.orders(user_id,total,customer_phone,customer_name,notes,checkout_key,stock_reserved)
     VALUES(uid,amount,prof.phone,prof.full_name,nullif(trim(p_notes),''),p_request_id,true) RETURNING id INTO oid;
   FOR item IN SELECT value FROM jsonb_array_elements(cart) LOOP
     SELECT * INTO prod FROM public.products WHERE id = (item->>'product_id')::uuid;
     qty := (item->>'quantity')::integer;
     unit := least(prod.price, coalesce(prod.discounted_price,prod.price));
     INSERT INTO public.order_items(order_id,product_id,product_name,unit_price,quantity,subtotal)
       VALUES(oid,prod.id,prod.name,unit,qty,unit*qty);
     UPDATE public.products SET stock = stock - qty WHERE id = prod.id;
     DELETE FROM public.cart_items WHERE id = (item->>'id')::uuid AND user_id = uid;
   END LOOP;
   INSERT INTO public.activity_logs(actor_id,action,entity_type,entity_id,metadata)
     VALUES(uid,'order_created','order',oid,jsonb_build_object('total',amount,'items_count',jsonb_array_length(cart)));
 END IF;
 SELECT jsonb_build_object('id',o.id,'total',o.total,'customer_name',o.customer_name,'customer_phone',o.customer_phone,'notes',o.notes,
   'items',(SELECT jsonb_agg(jsonb_build_object('name',i.product_name,'quantity',i.quantity,'unitPrice',i.unit_price) ORDER BY i.id)
     FROM public.order_items i WHERE i.order_id = o.id)) INTO result FROM public.orders o WHERE o.id = oid AND o.user_id = uid;
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.checkout_cart(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.checkout_cart(uuid,text) TO authenticated;
-- Clients may read their orders; creation is exclusively handled by checkout_cart.
REVOKE INSERT ON public.orders, public.order_items FROM anon, authenticated;
DROP POLICY IF EXISTS "Users create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users insert own order items" ON public.order_items;
CREATE OR REPLACE FUNCTION public.manage_order_transition()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE item record;
BEGIN
 IF NEW.status = OLD.status THEN RETURN NEW; END IF;
 IF OLD.status IN ('cancelled','rejected','delivered') OR
    (OLD.status = 'validated' AND NEW.status NOT IN ('delivered','cancelled')) THEN
   RAISE EXCEPTION 'INVALID_ORDER_TRANSITION';
 END IF;
 IF NEW.status IN ('cancelled','rejected') AND OLD.stock_reserved THEN
   FOR item IN SELECT product_id,quantity FROM public.order_items WHERE order_id = OLD.id ORDER BY product_id LOOP
     UPDATE public.products SET stock = stock + item.quantity WHERE id = item.product_id;
   END LOOP;
   NEW.stock_reserved := false;
 END IF;
 IF NEW.status IN ('validated','delivered') AND NOT OLD.purchase_counted THEN
   UPDATE public.profiles SET purchase_count = purchase_count + 1 WHERE user_id = OLD.user_id;
   NEW.purchase_counted := true;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.manage_order_transition() FROM PUBLIC;
CREATE TRIGGER manage_order_transition BEFORE UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.manage_order_transition();
-- Even administrators only change status and internal notes via the browser.
REVOKE UPDATE ON public.orders FROM authenticated;
GRANT UPDATE(status,admin_notes) ON public.orders TO authenticated;
COMMIT;
