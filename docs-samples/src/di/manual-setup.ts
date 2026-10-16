import type { Herald } from '@herald-analytics/core';

import { CheckoutViewModel } from '../quick-start';

// --8<-- [start:manual]
export class AppGraph {
  constructor(private readonly herald: Herald) {}

  // CheckoutViewModel asks for an EventTrackerService; Herald is one, so it is passed as that.
  checkoutViewModel(): CheckoutViewModel {
    return new CheckoutViewModel(this.herald);
  }
}
// --8<-- [end:manual]
