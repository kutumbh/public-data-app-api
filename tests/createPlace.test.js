const supertest = require('supertest');
const app = require('../index');
const data = {
    "id" : "100412",
    "categoryName" : " Afghanistan",
    "categoryCode" : "AF",
    "categoryType" : "Country",
    "sortOrder" : "AFG"
}
describe("Testing for create place data", ()=>{
    it("testing for place get response", async()=>{
        const f = await supertest(app)
        .post('/placesData/createPlacesData"')
        .set("Content-Type","application/json")
        .field("data", JSON.stringify(data))
        .set("Content-type", "multipart/form-data")
        .set("Authorization",
        "eyJraWQiOiJJNWpGN1lEZWZTTHhcL1h6SGhtZ0ZBRHkyemJJOFczbDloaWZaK2JUTmxUUT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI0NjkxNGQxMC1mOGFkLTRlNzktOTlmZC0xNzFjYmU4NDBlZDMiLCJhdWQiOiI3Mml0NzJmY3Vyb21vM281NWY3dTlvOHVsZCIsImV2ZW50X2lkIjoiYzY5YjRiNDUtZDY2Mi00NGQ0LWI1YzEtN2JlOTUyODU5NWJhIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2MTA0NDU3NjQsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1zb3V0aC0xLmFtYXpvbmF3cy5jb21cL2FwLXNvdXRoLTFfTGp2Q2JPS1dqIiwibmFtZSI6InZpc2hudSIsImNvZ25pdG86dXNlcm5hbWUiOiI0NjkxNGQxMC1mOGFkLTRlNzktOTlmZC0xNzFjYmU4NDBlZDMiLCJleHAiOjE2MTA0NDkzNjQsImlhdCI6MTYxMDQ0NTc2NCwiZW1haWwiOiJ2aXNobnUuZGFuZ2lAc3B0ci5jbyJ9.G9uGq63JbOyKqiEIlQPEmKDxHbXbEq2qY9MXN2C_E9TfuF9RtgO5tFvkTGSxHgmTugFBdlUdEquvUsaD4j4kzejD6mm0fjkP09J1FIY2JGQsZZVLN6Gggyi3cNbYqcE4vepfYPKlGm9l09PbC6kKjmS8Rk_xUNVP4Jq78-YrWAaEXPsulN_H3MQbx0lOGkcKpL01NkC-p1p1NCvCV5DNyfJYFNPOxyjZDLLpB6sAYHpzBwi-oDx0kMQpsIGy_MShdttYFxDpbBdAANmICfajeoFUWr1JkxpPaWnsCzMA53wuhNAT9dAJvXAvkcs6ZnXvglhiL28B-5VWaFdmF7VUHw"
        )
        expect(f.status).toBe(201);
        done(); 
    })
})
// describe("Loan Save Called", () => {
//     it("should pass ", async done => {
//     // return (
//     const f = await request(app)
//     .post("/loan/save")
//     .set("Content-type", "multipart/form-data")
//     .field("data", JSON.stringify(newData))
//     .field("isValid", true)
//     .set(
//     "Authorization",
//     "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzksIm5hbWUiOiJhLmxva2hhbmRlQHNwdHIuY28iLCJyb2xlTmFtZSI6IlJPTEVfVVNFUiIsImlhdCI6MTYwNDA0MTk4NSwiZXhwIjoxNjA0MDY3MTg1fQ.6SfHOArR5ZfE7p-3v098fc5GIjBerPszi8wCfLdhaYk"
//     );
//     expect(f.status).toBe(200);
//     done();
//     });
//    });