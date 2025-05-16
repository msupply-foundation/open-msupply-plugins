type Dates = {
  periodStartDate: Date;
  periodEndDate: Date;
  today: Date;
  lookBackMonths: number;
};

type Ledger = {
  [date: string]: { [itemId: string]: /* stock on date */ number };
};

type CommonParams = {
  storeId: string;
  itemIds: string[];
  dates: Dates;
};
