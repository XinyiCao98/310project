import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import Log from "../src/Util";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;
    let SERVER_URL = "http://localhost:4321";
    this.timeout(10000);

    const validQuery: any = {
        WHERE: {
            AND: [
                {
                    NOT: {
                        OR: [
                            {
                                LT: {
                                    courses_avg: 63
                                }
                            },
                            {
                                GT: {
                                    courses_avg: 70
                                }
                            }
                        ]
                    }
                },
                {
                    LT: {
                        courses_avg: 63.01
                    }
                }
            ]
        },
        OPTIONS: {
            COLUMN: [
                "courses_dept",
                "courses_id",
                "courses_avg"
            ],
            ORDER: "courses_avg"
        }
    };

    const invalidQuery = {
        OPTIONS: {
            COLUMNS: [
                "courses_dept",
                "courses_id",
                "courses_avg"
            ],
            ORDER: "courses_avg"
        }
    };

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        // TODO: start server here once and handle errors properly
        server.start();
    });

    after(function () {
        // TODO: stop server here once!
        server.stop();
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    // TODO: read your courses and rooms datasets here once!

    // Sample on how to format PUT requests
    /*
    it("PUT test for courses dataset", function () {
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.be.equal(204);
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });
    */

    it("TEST PUT add a new dataset", function () {
        try {
            return chai.request(SERVER_URL)
                .put("/dataset/courses/courses")
                .set("body", "./test/data/courses.zip")
                .then(function (res: any) {
                    expect(res.status).to.deep.equal(200);
                    expect(res.body.result).to.deep.equal(["courses"]);
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            Log.trace("add dataset unsuccessful");
        }
    });

    it("test valid query", function () {
        try {
            let out = [
                {courses_dept: "biol", courses_id: "155", courses_avg: 63},
                {courses_dept: "biol", courses_id: "155", courses_avg: 63},
                {courses_dept: "busi", courses_id: "293", courses_avg: 63},
                {courses_dept: "comm", courses_id: "292", courses_avg: 63},
                {courses_dept: "fopr", courses_id: "262", courses_avg: 63},
                {courses_dept: "lled", courses_id: "200", courses_avg: 63}
            ];
            return chai.request(SERVER_URL)
                .put("/validQuery")
                .send(validQuery)
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.be.equal({result: out});
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            Log.trace("fail to test valid query : " + err);
        }
    });

    it("test invalid query", function () {
        try {
            return chai.request(SERVER_URL)
                .put("/invalidQuery")
                .send(invalidQuery)
                .then(function (res: Response) {
                    // some logging here please!
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    expect(err.status).to.deep.equal(400);
                });
        } catch (err) {
            Log.trace("fail to test invalid query : " + err);
        }
    });

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
