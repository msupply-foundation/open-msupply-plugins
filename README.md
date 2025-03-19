# civ-plugins

Plugins for Cote D'Ivoire


## Backend - AMC adjusted by DOS

This should appear in every UI area, apart internal orders for stores that use aggregated AMC (where AMC as sum of consumption of supplied stores). In short it's the similar to normal AMC calculation but also takes into account days out of stock (DOS)

### Formula:

`endDate` = Today or period end date (for program requisition) 

`lookBackMonths` = store-preference.monthly-consumption-look-back-period in months

`startDate` = `endDate` + 1day - `lookBackMonths` (i.e 2022/01/31 + 1day - 2month = 2021/12/01), (TODO check boajs and 4D, node says  2025/04/28 + 1day - 2months = 2025/02/28)

`DOS` = All days between and including `startDate` and `endDate` where end of day total stock is 0

`consumption` = Sum of consumptions between and including `startDate` and `endDate`, this is using `consumption` view which counts outbound shipments and prescription in picked and above status

`numberOfDays` = 30 * `lookBackMonths`

`DOSInCalculation` = `DOS` or `numberOfDays` - 1 if `DOS` is bigger or equal to `DOS` 

**AdjustedAMC** = (`consumption` / `lookBackMonths`) * (`numberOfDays` / (`numberOfDays` - `DOS`))

If we are using this calculation, *days_out_of_stock* is also set on requisition line, this is only for requisition lines where item has consumption.

## Backend - Aggregated AMC

This will appear in requisitions under a certain condition, described below. It short it's using consumption from customers by looking at response requisitions, averaging out AMC for stores that have data missing

### Formula:

`items` = items in request requisition

`customer` = A name which has supplying store id set as current store, and at least has one of the `items` visible through master list

`totalNumberOfCustomer` = Total number of `customer`s visible for all items in calculation

**Should use Aggregated AMC** = if `totalNumberOfCustomer` is above zero, this calculation is for the whole requisition. Would revert to AMC adjusted by DOS if not true

`endDate` = Today or period end date (for program requisition) 

`startDate` = same as startDate calculation in AMC adjusted by DOS

For each item:

`responseRequisitionLines` = response requisition lines for this store and all `customer`s with average monthly consumption above zero, with period end date below or equal to `endDate`, with period start date above or equal to `startDate`, with `orderType` matching current request requisition (or not checked if missing in request requisition)

`latestResponseRequisitionLine` = latest `responseRequisitionLine` for the item based on end date of requisition

`numberOfCustomersForItem` = `customer`s which have this item visible through master list

`AverageAMC` = Sum of `latestResponseRequisitionLine`.average-monthly-consumption / number of `latestResponseRequisitionLine`s

`summedAverageAMC` = if `numberOfCustomersForItem` > number of `latestResponseRequisitionLine`s then `AverageAMC` * (`numberOfCustomersForItem` -  number of `latestResponseRequisitionLine`s) otherwise 0

**AggregatedMC** = Sum of `latestResponseRequisitionLine`.average-monthly-consumption + `summedAverageAMC`

## Backend - Suggested Quantity

This is similar to core suggested quantity calculation. The main difference is store preference of months lead time is used.

## Backend - Internal order Movements

Stock movement fields are populated in requisition, based on the period

`endDate` = Today or period end date

`startDate` = Today or period start date

**Initial Stock (initial_stock_on_hand_units)** = Total stock on hand at the end of the day before `startDate`
 
**Incoming (incoming_units)** = Stock IN, not including inventory adjustment, between and including `startDate` and `endDate`

**Outgoing (outgoing_units)** = Stock OUT, not including inventory adjustment, between and including `startDate` and `endDate`
 
**Addition (addition_in_units)** = Stock IN, for inventory adjustments only, between and including `startDate` and `endDate`

**Reduction (loss_in_units)** = Stock OUT, for inventory adjustments only, between and including `startDate` and `endDate`

**Available (available_stock_on_hand)** = `Initial Stock`  + `Incoming` + `Outgoing` (this is negative number) + `Addition` +` Reduction` (this is negative number)

### Formula

`currentMos` = available stock on hand / average monthly consumption
`targetMos` = target MOS (max months of stock) + store-preference.month_lead_time 

**Suggested Quantity** =  if `currentMos` > threshold MOS (min months of stock) then 0 otherwise (`targetMos` - `currentMos`) * average monthly consumption

## Testing, configurations and Extra details

### Installation

Download bundle.json from the root of the repo and run the following (`--url`, `--username` and `--password` should be for for omSupply server, which has to also be central server)

```
remote_server_cli install-plugin-bundle -p bundle.json --url 'http://localhost:8000' --username admin --password pass
```

###  Monthly consumption look back period

When this is not set as preference, then `order_lookback` global preference is used. We don't do this in omSupply, store must have monthly consumption look back period set otherwise will be defaulted to 3 (can't control this with plugin, we cant differentiate between default 3 or none set)

### Use consumption and stock from customers for internal order 

This preference must be set in mSupply for mSupply to use Cote d'Ivoire usage calculations

### Show extra field on requisitions

This preference must be set in mSupply for mSupply to fill in stock movements for the period

### Postgres

As of writing this I haven't quite tested in postgres version

### Date calculations

Dates and times are all relative to server's time zone. Start date will be set as start of the day (00:00:00) and end date will be set as end of the day (23:59:59).

The above would mean, that stocktake done on 31st of previous month, and finalised at 15:00 Cote d'Ivoire time,  will be captured as done on the 1st of next month if server is running on NZ timezone (if this data file is observed from machine in NZ).

### Slow requisition opening and item information panel

At the time of writing this description, I've observed some slowness when opening a requisition where aggregated MOS is calculated and displayed in the panel under requisition line edit.
There is an issue to fix this TODO create issue (also i think we are also getting ItemStats for item in requisition query, it should only come from RequisitionLineNode)

There is also an issue with item information panel not matching mSupply and aggregated AMC, this information panel should be implemented via plugin, but that would need some extra extensions for plugin interface (mainly graphql endpoint for running plugin as API)

### Using Aggregated stock on hand

In the wiki we have descriptions that we should sum up stock on hand, similar to aggregated AMC, we also have this calculation in mSupply, but I think it's being overwritten somewhere, thus it was no implemented for now.

### Total vs Available

We use total quantity for DOS and movements, even though on requisition the field is called available stock on hand, this plugin considers total stock when setting the total initial and available stock on hand at the end o the period

### Automated tests

TODO write up about test/graphql

### TODO

* Outline 'when' amc calculations are updated
* Double up on AMC calculation (currently requisition creating will call item stats, even though we would use transform requisition calculations), item stats should have "context", and ideally requisition ID if context is requisition (then we just do AMC withing average_monthly_consumption plugin)
* Can we expose more of the core, for things like item ledger ?
* Can add sql helpers to core plugin code (maybe even in rust code ?)
