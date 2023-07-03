const supertest = require('supertest');
const app = require('../index');
const data = {
        "fileUrl": "http://epaper.lokmat.com/articlepage.php?articleid=LOK_MULK_20200924_1_4",
        "fileName": "BSNL1",
        "fileSource": "Times Of India",
        "creator": "loamat",
        "fileSourceDate":"09-23-2020",
        "fileType":"PDF",
        "language":"English",
        "category":"Death News"
}
describe("Testing for files data", ()=>{
    it("testing for files get response", async()=>{
        const response = await supertest(app)
        .post('/createFiles')
        .set("Content-Type","application/json")
        .set("Content-Length", Object.keys(data).length)
        .set("Host","https://data-insertion-api.sptr.co/files")
        .set("Authorization","eyJraWQiOiJJNWpGN1lEZWZTTHhcL1h6SGhtZ0ZBRHkyemJJOFczbDloaWZaK2JUTmxUUT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI0NjkxNGQxMC1mOGFkLTRlNzktOTlmZC0xNzFjYmU4NDBlZDMiLCJhdWQiOiI3Mml0NzJmY3Vyb21vM281NWY3dTlvOHVsZCIsImV2ZW50X2lkIjoiMDdkZTkxYzYtYjRjMC00NTA0LTlkNGYtNTdlOTkyMTlkZWIzIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2MTAzNDg5MjQsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1zb3V0aC0xLmFtYXpvbmF3cy5jb21cL2FwLXNvdXRoLTFfTGp2Q2JPS1dqIiwibmFtZSI6InZpc2hudSIsImNvZ25pdG86dXNlcm5hbWUiOiI0NjkxNGQxMC1mOGFkLTRlNzktOTlmZC0xNzFjYmU4NDBlZDMiLCJleHAiOjE2MTAzNTI1MjQsImlhdCI6MTYxMDM0ODkyNCwiZW1haWwiOiJ2aXNobnUuZGFuZ2lAc3B0ci5jbyJ9.jcs-6RktoXbTU6Ny2domO4akeKMrJsvo_42AKMMZ60jEsCu65DIYW2A14Sagx4fegtRudkRxM7ngzq8MJmnClxcEzUdJMf8eFqomiqDhC_2BH-uaMnBocR3Ps4BoEzBteCEBYNCaAyG6cCpZfxdjutBWa3tq2GiIa6jzJPzGSlNBoYp-tjIQSTZ7Kl13VUchYJJgTKW08yTVS0tXYodDTyGnEh2Kk8o66Xx8UGRmnS3ek3XxzfnxaaM376Mt7wz8DwUjUHN4LksDIgLsP4oJnPJsxqqZs_9JsiV91ratCLo4fEvzsrbcUAHYXvMj0bGWUEZi2bgAsMGcrJZQCHRyTw")
        .send({
            "fileUrl": "http://epaper.lokmat.com/articlepage.php?articleid=LOK_MULK_20200924_1_4",
        "fileName": "BSNL1",
        "fileSource": "Times Of India",
        "creator": "loamat",
        "fileSourceDate":"09-23-2020",
        "fileType":"PDF",
        "language":"English",
        "category":"Death News"
        })
         expect(response.status).toBe(201);
    })
})