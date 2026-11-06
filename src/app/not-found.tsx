import { LeavePaymentFrame } from "@/components/checkout/PaymentModal";
import { StubPage } from "@/components/layout/StubPage";

export default function NotFound() {
  return (
    <>
      {/* If the payment provider sent the customer back inside our payment window, retry in the full window. */}
      <LeavePaymentFrame />
      <StubPage title="Page not found">The page you were looking for doesn’t exist or has moved.</StubPage>
    </>
  );
}
