const request = require("supertest");
// let request = supertest("https://data-insertion-api.sptr.co")
const app = require("../index");
describe("GET /user details", function() {
 it("responds with user details", function(done) {
 request(app)
 .get("/user/getUserDetails/")
 .query({ uname: "vishnu.dangi@sptr.co" })
//  .set("Accept", "application/json")
 .set("Host","https://data-insertion-api.sptr.co")
 .set(
 "Authorization",
 "eyJraWQiOiJJNWpGN1lEZWZTTHhcL1h6SGhtZ0ZBRHkyemJJOFczbDloaWZaK2JUTmxUUT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI0NjkxNGQxMC1mOGFkLTRlNzktOTlmZC0xNzFjYmU4NDBlZDMiLCJhdWQiOiI3Mml0NzJmY3Vyb21vM281NWY3dTlvOHVsZCIsImV2ZW50X2lkIjoiYmIzNGFiY2UtOTAxOC00MDJhLWJiNmQtMDcxNDNjYmQ4MGMwIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2MTA5NjYzNDYsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1zb3V0aC0xLmFtYXpvbmF3cy5jb21cL2FwLXNvdXRoLTFfTGp2Q2JPS1dqIiwibmFtZSI6InZpc2hudSIsImNvZ25pdG86dXNlcm5hbWUiOiI0NjkxNGQxMC1mOGFkLTRlNzktOTlmZC0xNzFjYmU4NDBlZDMiLCJleHAiOjE2MTA5Njk5NDYsImlhdCI6MTYxMDk2NjM0NiwiZW1haWwiOiJ2aXNobnUuZGFuZ2lAc3B0ci5jbyJ9.J90Q8xPlt-5-IqXpLXD2f6TT1KqzasOhPQVTwPruvE99VDUQBX6rUgAqLYjeeBQezRsrFvJbK9pGCyBtzLyV5iO59xsAUKbu9WUlYlurdVbVACrkQm1XCpQi2X8QkZm4vt4KMbJGNMd8qLmq7jaL6Rb94L7H_gxSL-RndObyrqJ4zJR87leXMytdBepTKiUlHLIpAPyyrBNnZswMMXj2KPZTy9BXFehlOTyZuBDO16CYpchxX6du9rQBhr_Z5GOwVNBBspXBqV-wseGKepLn9kf8WRTXc2ceLvzIQOU-ZPIZ73SC346a_UIon0-ipOr5YQmEmwPoCyoON6W__QGaKg"
 ).expect(201, done);
 });
});