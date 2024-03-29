import React, { useState, useEffect } from "react";
import Amplify, { API, graphqlOperation } from "aws-amplify";
import awsconfig from "../../aws-exports";
import {
  createPaymentIntent,
  createDonation,
  processDonation,
} from "./../../graphql/customQueries/mutations";
import * as queries from "../../graphql/customQueries/queries";

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

export default function Donate(props) {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDonee, setSelectedDonee] = useState(null);

  const params = useParams();

  useEffect(() => {
    async function getUser() {
      const response = await API.graphql(
        graphqlOperation(queries.getUser, { id: params.userId })
      );
      const user = await response.data.getUser;
      console.log(user);
      if (!user) {
        alert("User doesn't exist");
      }
      setCurrentUser(user);
    }
    async function getSelectedDonee() {
      const response = await API.graphql(
        graphqlOperation(queries.retrieveDonee, { doneeId: params.doneeId })
      );
      const donee = JSON.parse(await response.data.retrieveDonee);
      setSelectedDonee(donee);
    }

    getUser();
    getSelectedDonee();
  }, [params.doneeId, params.userId]);

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        history={props.history}
        currentUser={currentUser}
        selectedDonee={selectedDonee}
      />
    </Elements>
  );
}

function CheckoutForm(props) {
  const [isPaymentLoading, setPaymentLoading] = useState(false);
  const [amountToDonate, setAmountToDonate] = useState(500);
  const [isOtherChecked, setIsOtherChecked] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  //click donate button
  const donate = async (e) => {
    e.preventDefault();
    const cardElementContainer = document.querySelector("#card");

    let cardElementComplete = cardElementContainer.classList.contains(
      "StripeElement--complete"
    );

    if (!cardElementComplete) {
      alert("Please complete your payment information.");
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    if (isOtherChecked) {
      if (amountToDonate == null) {
        alert("Please enter or select an amount to donate.");
        return;
      }
    }

    setPaymentLoading(true);

    try {
      const clientSecret = await API.graphql(
        graphqlOperation(createPaymentIntent, {
          email: props.currentUser.email,
          userId: props.currentUser.id,
          amount: amountToDonate,
        })
      );
      const paymentResult = await stripe.confirmCardPayment(
        clientSecret.data.createPaymentIntent,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: `${props.currentUser.name} ${props.currentUser.lastName}`,
              email: props.currentUser.email,
            },
          },
          setup_future_usage: isSavingCard ? "off_session" : "",
        }
      );
      setPaymentLoading(false);

      if (paymentResult.error) {
        alert(paymentResult.error.message);
        setPaymentLoading(false);
      } else {
        if (paymentResult.paymentIntent.status === SUCCEEDED) {
          const donation = await API.graphql(
            graphqlOperation(createDonation, {
              input: {
                userId: props.currentUser.id,
                doneeId: props.selectedDonee.id,
                locationId: props.selectedDonee.location.id,
                stripeTransactionId: paymentResult.paymentIntent.id,
                amount: amountToDonate,
                gratificationId: "NONE",
              },
            })
          );
          const donationProcessed = await API.graphql(
            graphqlOperation(processDonation, {
              doneeName: props.selectedDonee.firstName,
              userFirstName: props.currentUser.name,
              userEmail: props.currentUser.email,
              amount: amountToDonate,
            })
          );
          console.log(donationProcessed);
          props.history.push("/thank-you");
        } else {
          //TO-DO: void stripe transaction
        }
      }
    } catch (err) {
      console.log("Error: ", err);
      setPaymentLoading(false);
    }
  };

  let handleDefinedAmountClick = (e) => {
    setIsOtherChecked(false);
    setAmountToDonate(e.target.value * 100);
  };

  let handleOtherAmount = (e) => {
    setAmountToDonate(e.target.value * 100);
  };

  let handleOtherCheck = (e) => {
    setIsOtherChecked(true);
    setAmountToDonate(null);
  };

  return (
    <div
      style={{
        padding: "2.5rem",
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
              src={props.selectedDonee && props.selectedDonee.profilePhotoUrl}
              className="donee-image"
              alt="Donee"
            ></img>

            <div className="amount-container" disabled={isPaymentLoading}>
              <input
                type="radio"
                id="a3"
                name="amount"
                value="2.7"
                onChange={handleDefinedAmountClick}
              />
              <label className="fixed-amount" htmlFor="a3">
                3 meals <br></br>($2.70)
              </label>

              <input
                type="radio"
                id="a5"
                name="amount"
                value="4.5"
                onChange={handleDefinedAmountClick}
                defaultChecked
              />
              <label className="fixed-amount" htmlFor="a5">
                5 meals <br></br>($4.50)
              </label>

              <input
                type="radio"
                id="a10"
                name="amount"
                value="9"
                onChange={handleDefinedAmountClick}
              />
              <label className="fixed-amount" htmlFor="a10">
                10 meals <br></br>($9.00)
              </label>

              <input
                type="radio"
                id="a20"
                name="amount"
                value="18"
                onChange={handleDefinedAmountClick}
              />
              <label className="fixed-amount" htmlFor="a20">
                20 meals <br></br>($18.00)
              </label>

              <div className="break"></div>
              {!isOtherChecked && (
                <input
                  type="radio"
                  id="other"
                  name="amount"
                  value={isOtherChecked}
                  onClick={handleOtherCheck}
                />
              )}
              {!isOtherChecked && <label htmlFor="other">Other amount</label>}
              {isOtherChecked && (
                <div className="other-amount-wrapper">
                  <span className="currency-code">$</span>
                  <input
                    type="number"
                    id="other-input"
                    name="otherAmount"
                    onChange={handleOtherAmount}
                  />
                </div>
              )}
            </div>

            <CardElement
              className="card"
              id="card"
              options={{
                style: {
                  base: {
                    backgroundColor: "white",
                    fontSize: "16px",
                    width: "70%",
                  },
                },
              }}
            />
            <button className="pay-button" disabled={isPaymentLoading}>
              {isPaymentLoading ? "Processing..." : "Donate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
