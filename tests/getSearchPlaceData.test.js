const request = require("supertest");
const app = require("../index");
describe("GET /place details", function() {
 it("responds with place details", function(done) {
 request(app)
 .get("/placesData/getSearchData/DN")
 .set("Accept", "application/json")
 .set(
 "Authorization",
"eyJraWQiOiJJNWpGN1lEZWZTTHhcL1h6SGhtZ0ZBRHkyemJJOFczbDloaWZaK2JUTmxUUT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI0NjkxNGQxMC1mOGFkLTRlNzktOTlmZC0xNzFjYmU4NDBlZDMiLCJhdWQiOiI3Mml0NzJmY3Vyb21vM281NWY3dTlvOHVsZCIsImV2ZW50X2lkIjoiYzY5YjRiNDUtZDY2Mi00NGQ0LWI1YzEtN2JlOTUyODU5NWJhIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2MTA0NDU3NjQsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1zb3V0aC0xLmFtYXpvbmF3cy5jb21cL2FwLXNvdXRoLTFfTGp2Q2JPS1dqIiwibmFtZSI6InZpc2hudSIsImNvZ25pdG86dXNlcm5hbWUiOiI0NjkxNGQxMC1mOGFkLTRlNzktOTlmZC0xNzFjYmU4NDBlZDMiLCJleHAiOjE2MTA0NDkzNjQsImlhdCI6MTYxMDQ0NTc2NCwiZW1haWwiOiJ2aXNobnUuZGFuZ2lAc3B0ci5jbyJ9.G9uGq63JbOyKqiEIlQPEmKDxHbXbEq2qY9MXN2C_E9TfuF9RtgO5tFvkTGSxHgmTugFBdlUdEquvUsaD4j4kzejD6mm0fjkP09J1FIY2JGQsZZVLN6Gggyi3cNbYqcE4vepfYPKlGm9l09PbC6kKjmS8Rk_xUNVP4Jq78-YrWAaEXPsulN_H3MQbx0lOGkcKpL01NkC-p1p1NCvCV5DNyfJYFNPOxyjZDLLpB6sAYHpzBwi-oDx0kMQpsIGy_MShdttYFxDpbBdAANmICfajeoFUWr1JkxpPaWnsCzMA53wuhNAT9dAJvXAvkcs6ZnXvglhiL28B-5VWaFdmF7VUHw" 
 )
.expect(201, done);
 });
});