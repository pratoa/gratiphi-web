import React, { useState } from "react";
import Amplify, { API, graphqlOperation } from "aws-amplify";
import awsconfig from "../../aws-exports";
import { createPaymentIntent } from "./../../graphql/queries";

import "./Donate.css";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

Amplify.configure({
  ...awsconfig,
  Analytics: {
    disabled: true,
  },
});

const stripePromise = loadStripe(
  "pk_test_51ILbpBAx0O8AnxyhqXwQmvrIZP1ezIMumif9m5h2nBLjWi7zPk1G13WLBIxHwgjezITExWfmNl34FHEB0ssxMJ8F00JZKz8auA"
);

function Donate() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}

function CheckoutForm() {
  const [isPaymentLoading, setPaymentLoading] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const donate = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    setPaymentLoading(true);

    const clientSecret = await API.graphql(
      graphqlOperation(createPaymentIntent)
    );
    console.log(clientSecret);

    const paymentResult = await stripe.confirmCardPayment(
      clientSecret.data.createPaymentIntent,
      {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: "Andres Prato",
            email: "prato.andres@gmail.com",
          },
        },
      }
    );

    setPaymentLoading(false);
    if (paymentResult.error) {
      alert(paymentResult.error.message);
    } else {
      if (paymentResult.paymentIntent.status === "succeeded") {
        alert("Success!");
      }
    }
  };

  return (
    <div
      style={{
        padding: "3rem",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          margin: "0 auto",
        }}
      >
        <form
          style={{
            display: "block",
            width: "100%",
          }}
          onSubmit={donate}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <CardElement
              className="card"
              options={{
                style: {
                  base: {
                    backgroundColor: "white",
                  },
                },
              }}
            />
            <button className="pay-button" disabled={isPaymentLoading}>
              {isPaymentLoading ? "Loading..." : "Pay"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Donate;
