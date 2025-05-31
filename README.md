## Process messages to create a prescription

    * processor -> to process incoming messages
    * use_graphql -> within a plugin to call graphql for creating prescriptions and checking item stock
    * graphql_query -> would call use_graphql to show the difference in async blocking functionality
    * use_repository

This branch also demonstrate graphql types, the can be generated with [this command](https://github.com/msupply-foundation/open-msupply-plugins/blob/5e9382cf8ebd563d7cf70812c73049baa70f2d85/backend/latest/package.json#L17C6-L17C52), similar to reports

Needs this PR: https://github.com/msupply-foundation/open-msupply/pull/7975

Load plugin this plugin

Use data file [here](https://drive.google.com/drive/u/1/folders/1RZj20Z2Nh9QARPrQOnYB9H1S-9IeuZb9): 

user1 -> user1 for OG related stuff, like registering etc..
test -> pass for site initialisation
test -> pass for omSupply user

Run this code to create messages, then sync and see prescriptions created:

```
$newMsg:=ds.message.new()
$newMsg.ID:="1"
$newMsg.toStoreID:="572B52B26FB54D4896C740F35BCBC75E"
$newMsg.fromStoreID:=""
$newMsg.body:="{\"itemId\": \"2FC2E930CCD543C883D17BCDD0EB1251\", \"patientId\": \"0196f0ec-e3fe-7745-ace7-a15ad08bf9f9\" }"
$newMsg.createdDate:=!2023-01-01!
$newMsg.createdTime:=?02:03:04?
$newMsg.status:="new"
$newMsg.type:="createPrescription"
$newMsg.save()
```

Increase msg id to create more messages, after prescription is generated and subsequent sync, inspect message table in mSupply, see 'error' message, when there is not stock etc..

Run this graphql to see use_graphql within a plugin and actix web context

```gql
query MyQuery($input: JSON!) {
  pluginGraphqlQuery(
    input: $input
    pluginCode: "plugin_examples"
    storeId: "572B52B26FB54D4896C740F35BCBC75E"
  )
}
```
```json
{
  "input": {
    "type": "doubleEcho",
    "echo": "echome"
  }
}
```

