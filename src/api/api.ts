import type { Stripe } from 'stripe';

export class Api {
  headers: Record<string, string>;
  api_url: string;

  constructor() {
    this.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    this.api_url = process.env.API_URL;
  }
  
  async capturePaymentIntent(
    paymentIntentId: string,
    email: string
  ): Promise<Partial<Stripe.PaymentIntent> | { error: Stripe.StripeAPIError }> {
    const formData = new FormData();
    formData.append('payment_intent_id', paymentIntentId);
    formData.append('email', email);

    return fetch(`${this.api_url}/mobile-capture_payment_intent`, {
      method: 'POST',
      body: formData,
    })
      .then((resp) => resp.json())
      .then((j) => ({
        client_secret: j.client_secret,
        id: j.id,
      }));
  }

  async createConnectionToken(): Promise<
    Stripe.Terminal.ConnectionToken | { error: Stripe.StripeAPIError }
  > {
    const formData = new URLSearchParams();
    return fetch(`${this.api_url}/mobile-connection_token`, {
      headers: this.headers,
      method: 'POST',
      body: formData.toString(),
    }).then((resp) => resp.json());
  }
}
