import React, { useState, useEffect } from "react";
import Amplify, { API, graphqlOperation } from "aws-amplify";
import awsconfig from "../../aws-exports";
import {
  createPaymentIntent,
  createDonations,
} from "./../../graphql/mutations";
import * as queries from "./../../graphql/queries";

import "./Donate.css";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useParams } from "react-router-dom";

Amplify.configure({
  ...awsconfig,
  Analytics: {
    disabled: true,
  },
});

const SUCCEEDED = "succeeded";
const stripePromise = loadStripe(
  "pk_test_51ILbpBAx0O8AnxyhqXwQmvrIZP1ezIMumif9m5h2nBLjWi7zPk1G13WLBIxHwgjezITExWfmNl34FHEB0ssxMJ8F00JZKz8auA"
);

function Donate() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDonee, setSelectedDonee] = useState(null);

  const params = useParams();

  useEffect(() => {
    async function getUser() {
      const response = await API.graphql(
        graphqlOperation(queries.getUser, { id: params.userId })
      );
      const user = await response.data.getUser;
      setCurrentUser(user);
    }
    async function getSelectedDonee() {
      const response = await API.graphql(
        graphqlOperation(queries.getDonee, { id: params.doneeId })
      );
      const donee = await response.data.getDonee;
      setSelectedDonee(donee);
    }

    getUser();
    getSelectedDonee();
  }, []);

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm currentUser={currentUser} selectedDonee={selectedDonee} />
    </Elements>
  );
}

function CheckoutForm(props) {
  const [isPaymentLoading, setPaymentLoading] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const amount = 1500;
  const donate = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    setPaymentLoading(true);

    const clientSecret = await API.graphql(
      graphqlOperation(createPaymentIntent, {
        email: props.currentUser.email,
        userId: props.currentUser.id,
        amount: amount,
      })
    );
    console.log(clientSecret);

    const paymentResult = await stripe.confirmCardPayment(
      clientSecret.data.createPaymentIntent,
      {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: "Andres Prato",
            email: props.currentUser.email,
          },
        },
      }
    );

    setPaymentLoading(false);
    if (paymentResult.error) {
      alert(paymentResult.error.message);
    } else {
      if (paymentResult.paymentIntent.status === SUCCEEDED) {
        const donation = await API.graphql(
          graphqlOperation(createDonations, {
            email: props.currentUser.email,
            userId: props.currentUser.id,
            amount: amount,
          })
        );
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
            <h3>{props.selectedDonee && props.selectedDonee.firstName}</h3>
            <img
              src={props.selectedDonee && props.selectedDonee.profilePhoto}
              className="donee-image"
              alt="Donee"
            ></img>

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
