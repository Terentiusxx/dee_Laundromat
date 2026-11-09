// UI demo fixtures. Replace with your authenticated bookings API.
export type OrderStatus = "In Progress" | "Ready for Pickup" | "Completed" | "Delivered" | "Cancelled";
export type LaundryOrder = {
  id: string;
  status: OrderStatus;
  method: "Pickup & Delivery" | "In-Store Drop-off";
  service: string;
  image: string;
  itemCount: number;
  pickupDate: string;
  pickupTime: string;
  deliveryDate?: string;
  deliveryTime?: string;
  total: number;
  placedDate: string;
  pickupAddress: string;
  deliveryAddress?: string;
  paymentMethod: string;
  paymentStatus: "Paid" | "Awaiting payment" | "Refunded";
  turnaround: "Standard" | "Express";
  items: { name: string; detail: string; amount: number }[];
};

export const orders: LaundryOrder[] = [
  {
    id: "DL-2026-0018", status: "In Progress", method: "Pickup & Delivery", service: "Wash & Fold, Ironing", image: "/images/my-order-1.webp", itemCount: 8,
    pickupDate: "2026-10-25", pickupTime: "09:00 – 10:00", deliveryDate: "2026-10-27", deliveryTime: "14:00 – 16:00", total: 110, placedDate: "2026-10-24",
    pickupAddress: "East Legon, Accra", deliveryAddress: "East Legon, Accra", paymentMethod: "Pay later", paymentStatus: "Awaiting payment", turnaround: "Standard",
    items: [{name:"Wash & Fold",detail:"5 kg (estimated)",amount:60},{name:"Ironing & Pressing",detail:"4 garments",amount:50}],
  },
  {
    id: "DL-2026-0016", status: "Ready for Pickup", method: "In-Store Drop-off", service: "Dry Cleaning", image: "/images/my-order-2.webp", itemCount: 12,
    pickupDate: "2026-10-23", pickupTime: "11:00 – 12:00", deliveryDate: "2026-10-26", deliveryTime: "16:00 – 18:00", total: 160, placedDate: "2026-10-22",
    pickupAddress: "Sample store · Accra", paymentMethod: "Card", paymentStatus: "Paid", turnaround: "Standard",
    items: [{name:"Dry Cleaning", detail:"12 garments", amount:160}],
  },
  {
    id: "DL-2026-0015", status: "Completed", method: "Pickup & Delivery", service: "Bedding", image: "/images/my-order-3.webp", itemCount: 3,
    pickupDate: "2026-10-12", pickupTime: "08:00 – 09:00", deliveryDate: "2026-10-13", deliveryTime: "10:00 – 12:00", total: 75, placedDate: "2026-10-11",
    pickupAddress: "Airport Residential, Accra", deliveryAddress: "Airport Residential, Accra", paymentMethod: "Card", paymentStatus: "Paid", turnaround: "Express",
    items: [{name:"Bedding & Household",detail:"3 items",amount:75}],
  },
  {
    id: "DL-2026-0017", status: "Delivered", method: "Pickup & Delivery", service: "Dry Cleaning", image: "/images/my-order-4.webp", itemCount: 5,
    pickupDate: "2026-10-19", pickupTime: "14:00 – 15:00", deliveryDate: "2026-10-20", deliveryTime: "12:00 – 14:00", total: 125, placedDate: "2026-10-18",
    pickupAddress: "Cantonments, Accra", deliveryAddress: "Cantonments, Accra", paymentMethod: "Card", paymentStatus: "Paid", turnaround: "Express",
    items: [{name:"Dry Cleaning",detail:"5 garments",amount:125}],
  },
  {
    id: "DL-2026-0013", status: "Cancelled", method: "Pickup & Delivery", service: "Wash & Fold", image: "/images/my-order-5.webp", itemCount: 6,
    pickupDate: "2026-09-28", pickupTime: "15:00 – 16:00", total: 90, placedDate: "2026-09-27",
    pickupAddress: "East Legon, Accra", deliveryAddress: "East Legon, Accra", paymentMethod: "Pay later", paymentStatus: "Awaiting payment", turnaround: "Standard",
    items: [{name:"Wash & Fold",detail:"Estimated weight · 6 kg",amount:90}],
  },
  {
    id: "DL-2026-0012", status: "In Progress", method: "Pickup & Delivery", service: "Wash & Fold", image: "/images/my-order-6.webp", itemCount: 10,
    pickupDate: "2026-10-24", pickupTime: "10:00 – 11:00", deliveryDate: "2026-10-27", deliveryTime: "15:00 – 17:00", total: 140, placedDate: "2026-10-23",
    pickupAddress: "Spintex, Accra", deliveryAddress: "Spintex, Accra", paymentMethod: "Mobile Money", paymentStatus: "Paid", turnaround: "Standard",
    items: [{name:"Wash & Fold",detail:"Estimated weight · 10 kg",amount:140}],
  },
];

export const money = (n: number) => `GHS ${n.toFixed(2)}`;
export function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {month:"short",day:"numeric",year:"numeric"});
}
export function statusGroup(status: OrderStatus): "Active" | "Completed" | "Cancelled" {
  if (status === "Cancelled") return "Cancelled";
  if (status === "Completed" || status === "Delivered") return "Completed";
  return "Active";
}
