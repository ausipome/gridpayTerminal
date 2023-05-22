import type { Stripe } from 'stripe';

export class Api {
  headers: Record<string, string>;
  api_url: string;

  constructor() {
    this.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    this.api_url = process.env.API_URL;
    this.CONECTION_SECRET = process.env.CONECTION_SECRET;
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

    const formData = new FormData();
    formData.append('secret', this.CONECTION_SECRET);
    return fetch(`${this.api_url}/mobile-connection_token`, {
      method: 'POST',
      body: formData,
    }).then((resp) => resp.json());
  }
}
