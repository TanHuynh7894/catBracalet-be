declare module '@payos/node' {
  export type PayOSCreateRequest = {
    orderCode: number;
    amount: number;
    description: string;
    returnUrl: string;
    cancelUrl: string;
  };

  export type PayOSCreateResponse = {
    checkoutUrl: string;
    paymentLinkId: string;
  };

  export type PayOSGetResponse = {
    id: string;
    orderCode: number;
    amount: number;
    status: string;
    createdAt?: string;
    transactions?: any[];
  };

  export class PayOS {
    constructor(config: {
      clientId: string;
      apiKey: string;
      checksumKey: string;
    });

    paymentRequests: {
      create(data: PayOSCreateRequest): Promise<PayOSCreateResponse>;
      get(orderCode: number): Promise<PayOSGetResponse>;
    };
  }
}
