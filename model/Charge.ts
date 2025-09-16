import moment from 'moment';

import type { ChargeScheduleType, ChargeType, DebtorScheduleType } from '@customTypes/charges';
import type {DurationInputArg2} from 'moment';


class ChargeScheduler {
  data: ChargeType;

  constructor(params: ChargeType) {
    this.data = params;
  }

  build() {
    const { debtors, totalDebt, nextCharge } = this.buildDebts();

    const chargeSchedule: ChargeScheduleType = {
      ...this.data,
      debtors,
      totalDebt,
      nextCharge,
    };

    return chargeSchedule;
  }

  buildDebts() {
    const { debtors, startChargeDate, amount, repeat } = this.data;

    const targetDate = repeat.isAlways
      ? moment()
      : moment.unix(startChargeDate).add(repeat.times - 1, repeat.type as DurationInputArg2);

    const startChargeDateMoment = moment.unix(startChargeDate);

    const totalPayments = targetDate.diff(startChargeDateMoment, repeat.type as DurationInputArg2);

    const totalDebtDefault = amount * totalPayments;

    const debtorsSchedule: Array<DebtorScheduleType> = debtors.map((debtor) => {
      const { factor, payments } = debtor;

      let targetPayment = 0;

      if (factor === 1) {
        targetPayment = totalDebtDefault;
      } else {
        targetPayment = amount * factor * totalPayments;
      }

      const totalPaid = payments.reduce((acc, payment) => acc + payment.amount, 0);

      const debt = Number((targetPayment - totalPaid).toFixed(2));

      const pending = Math.ceil(debt / (amount * factor));

      const debtorSchedule: DebtorScheduleType = {
        ...debtor,
        debt,
        targetPayment,
        lastPaymentDate: payments.at(-1)?.date,
        pendingPayments: Number.isNaN(pending) ? 0 : Number(pending),
      };

      return debtorSchedule;
    });

    const totalDebt = debtorsSchedule.reduce((acc, debtor) => acc + debtor.debt, 0);

    const nextCharge = moment()
      .set({
        date: startChargeDateMoment.date(),
      })
      .unix();

    return {
      debtors: debtorsSchedule.sort((a, b) => b.debt - a.debt),
      totalDebt,
      nextCharge,
    };
  }
}

export default ChargeScheduler;
