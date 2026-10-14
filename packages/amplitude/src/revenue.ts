import { Revenue } from '@amplitude/analytics-react-native';
import {
  double,
  int,
  parametersOf,
  type Event,
  type EventParameters,
} from '@herald-analytics/core';

import { toAmplitudeProperties } from './values';

export interface AmplitudeRevenueEventOptions {
  /** Not sent. Only used in failure reports. */
  readonly name: string;
  /** Price of one item. Amplitude drops revenue without it. */
  readonly price: number;
  /** A whole number. 1 by default. */
  readonly quantity?: number;
  readonly productId?: string;
  readonly revenueType?: string;
  /** Without one, Amplitude assumes USD. */
  readonly currency?: string;
  /** The total, when it isn't price times quantity. */
  readonly revenue?: number;
  readonly receipt?: string;
  readonly receiptSig?: string;
  /** Makes a purchase sent twice count once. */
  readonly insertId?: string;
  readonly parameters?: EventParameters;
}

/**
 * A purchase, in the fields Amplitude's revenue API takes.
 *
 * Your events don't extend it: your Amplitude factory builds one from your event and sends it with
 * `RevenueAmplitudeEventTracker`.
 *
 * Throws for a quantity that isn't whole, or a price or total that isn't a finite number.
 */
export class AmplitudeRevenueEvent implements Event {
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
  readonly productId?: string;
  readonly revenueType?: string;
  readonly currency?: string;
  readonly revenue?: number;
  readonly receipt?: string;
  readonly receiptSig?: string;
  readonly insertId?: string;
  readonly parameters: EventParameters;

  constructor(options: AmplitudeRevenueEventOptions) {
    const quantity = options.quantity ?? 1;
    // Called for their checks only: they throw for a wrong number.
    double(options.price);
    int(quantity);
    if (options.revenue !== undefined) double(options.revenue);
    this.name = options.name;
    this.price = options.price;
    this.quantity = quantity;
    this.productId = options.productId;
    this.revenueType = options.revenueType;
    this.currency = options.currency;
    this.revenue = options.revenue;
    this.receipt = options.receipt;
    this.receiptSig = options.receiptSig;
    this.insertId = options.insertId;
    this.parameters = options.parameters ?? {};
  }

  /**
   * This purchase as Amplitude's `Revenue`. `insertId` isn't in it: the tracker sends it as an
   * event option.
   */
  toAmplitudeRevenue(): Revenue {
    const revenue = new Revenue().setPrice(this.price).setQuantity(this.quantity);
    if (this.productId !== undefined) revenue.setProductId(this.productId);
    if (this.revenueType !== undefined) revenue.setRevenueType(this.revenueType);
    if (this.currency !== undefined) revenue.setCurrency(this.currency);
    if (this.revenue !== undefined) revenue.setRevenue(this.revenue);
    if (this.receipt !== undefined) revenue.setReceipt(this.receipt);
    if (this.receiptSig !== undefined) revenue.setReceiptSig(this.receiptSig);
    return revenue.setEventProperties(toAmplitudeProperties(parametersOf(this)));
  }

  toString(): string {
    return `AmplitudeRevenueEvent(${this.name}, price: ${this.price}, quantity: ${this.quantity})`;
  }
}
