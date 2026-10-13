import type { Category, Journey, Passenger } from "./config";
import type { Fare } from "./booking";
export type BookingStatus =
  | "requested"
  | "quoted"
  | "assigned"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected";
export const statusLabels: Record<BookingStatus, string> = {
  requested: "Request received",
  quoted: "Fare approved",
  assigned: "Driver assigned",
  confirmed: "Booking confirmed",
  completed: "Trip completed",
  cancelled: "Cancelled",
  rejected: "Unable to fulfil",
};
export interface Driver {
  id: string;
  name: string;
  phone: string;
  city: string;
  category: Category;
  vehicle: string;
  plate: string;
  active: boolean;
}
export interface Booking {
  reference: string;
  journey: Journey;
  passenger: Passenger;
  category: Category;
  estimate: Fare;
  status: BookingStatus;
  finalFare: number | null;
  fareNote: string;
  driver: Driver | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface BookingEvent {
  id: number;
  action: string;
  actor: string;
  note: string;
  createdAt: string;
}
export interface Notification {
  id: number;
  booking_ref: string;
  status: "pending" | "sending" | "accepted" | "failed" | "unknown" | "manual";
  body: string;
  provider_id: string | null;
  error: string | null;
  created_at: string;
}
export interface PublicBooking {
  reference: string;
  journey: Journey;
  category: Category;
  status: BookingStatus;
  estimate: Fare;
  finalFare: number | null;
  fareNote: string;
  driver: Pick<Driver, "name" | "phone" | "vehicle" | "plate"> | null;
  updatedAt: string;
}
