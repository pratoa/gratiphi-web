import logo from "../../images/gratiphi-logo.png";
import "./ThankYou.css";

export default function ThankYou() {
  return (
    <div className="thank-you">
      <header className="header"></header>
      <body>
        <div className="medium-text">Thank you!</div>
        <img src={logo} className="logo" alt="logo" />
      </body>
    </div>
  );
}
