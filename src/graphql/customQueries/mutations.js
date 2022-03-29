export const createPaymentIntent = /* GraphQL */ `
  mutation CreatePaymentIntent(
    $email: String
    $userId: String
    $amount: Float
  ) {
    createPaymentIntent(email: $email, userId: $userId, amount: $amount)
  }
`;

export const processDonation = /* GraphQL */ `
  mutation ProcessDonation(
    $doneeName: String
    $userFirstName: String
    $userEmail: String
    $amount: Float
  ) {
    processDonation(
      doneeName: $doneeName
      userFirstName: $userFirstName
      userEmail: $userEmail
      amount: $amount
    )
  }
`;

export const createDonation = /* GraphQL */ `
  mutation CreateDonation(
    $input: CreateDonationInput!
    $condition: ModelDonationConditionInput
  ) {
    createDonation(input: $input, condition: $condition) {
      id
      userId
      doneeId
      locationId
      stripeTransactionId
      amount
    }
  }
`;
