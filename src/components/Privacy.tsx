export default function Privacy() {
  return (
    <div className="ops-page">
      <header className="ops-top">
        <a className="ops-brand" href="/">
          journeycab<span>.</span>
        </a>
      </header>
      <main className="tracking-content surface">
        <span className="eyebrow">YOUR DETAILS, YOUR JOURNEY</span>
        <h1>Booking contact & privacy</h1>
        <p>
          When you request a ride, we save your name, phone number, optional
          email, trip details, pickup and drop addresses, and your
          booking-contact consent.
        </p>
        <h2>How the team uses your details</h2>
        <p>
          Authorised booking staff use your request to contact you, agree the
          fare, check partner availability and assign a driver. The assigned
          partner needs your contact and pickup/drop information to fulfil the
          journey. If SMS delivery is enabled, the messaging provider processes
          your phone number and booking-update message.
        </p>
        <h2>Your private status link</h2>
        <p>
          Your reference alone does not provide access. The private link
          includes an access key; keep it safe and share it only with people you
          trust. It shows trip status, fare and confirmed driver details.
          Booking records remain on the server when you close the browser.
        </p>
        <h2>Requests and cancellations</h2>
        <p>
          Submitting a ride request does not reserve a vehicle or collect
          payment. Our team confirms availability, fare and applicable
          cancellation terms with you. Contact the staff member arranging your
          booking if you need changes or want to discuss your data.
        </p>
        <div className="ops-notice">
          <p>
            <strong>Pre-launch notice:</strong> The operator’s legal identity,
            privacy contact and retention period still need to be supplied
            before this service accepts real customer requests.
          </p>
        </div>
        <a className="button secondary" href="/">
          Back to the website
        </a>
      </main>
    </div>
  );
}
