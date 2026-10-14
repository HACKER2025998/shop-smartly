import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProductGallery } from "@/components/shop/ProductGallery";
afterEach(cleanup);
describe("Product gallery compatibility", () => {
 it("renders the legacy cover without a gallery field", () => {
  render(<ProductGallery name="Sac" cover="https://example.com/cover.jpg"/>);
  expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/cover.jpg");
  expect(screen.queryByRole("button")).toBeNull();
 });
 it("deduplicates the cover and switches photos", () => {
  render(<ProductGallery name="Sac" cover="https://example.com/cover.jpg" images={["https://example.com/cover.jpg","https://example.com/side.jpg"]}/>);
  expect(screen.getAllByRole("button")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "Afficher la photo 2" }));
  expect(screen.getByAltText("Sac — photo 2")).toHaveAttribute("src", "https://example.com/side.jpg");
 });
 it("handles products without photos", () => {
  render(<ProductGallery name="Sac" cover={null}/>);
  expect(screen.queryByRole("img")).toBeNull();
 });
});
