import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import Log from "../src/Util";
import * as fs from "fs";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;
    let SERVER_URL = "http://localhost:4321";
    this.timeout(10000);

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

    it("test valid query for courses in disk only", function () {
        try {
            let query = JSON.parse(fs.readFileSync("./test/newQueries/test1.json", "utf8"));
            return chai.request(SERVER_URL)
                .post("/query")
                .send(query)
                .then(function (res: any) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("error :" + err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace("fail to test valid query : " + err);
        }
    });

    it("delete dataset before testing", function () {
        try {
            return chai.request(SERVER_URL)
                .del("/dataset/courses")
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.deep.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            Log.trace("fail to test delete dataset : " + err);
        }
    });

    it("TEST PUT add a new dataset on courses", function () {
        try {
            return chai.request(SERVER_URL)
                .put("/dataset/courses/courses")
                .send(fs.readFileSync("./test/data/courses.zip"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: any) {
                    Log.trace("inside test");
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

    it("TEST fail to PUT add a new dataset with incorrect name", function () {
        try {
            return chai.request(SERVER_URL)
                .put("/dataset/courses/shelley")
                .send(fs.readFileSync("./test/data/courses.zip"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: any) {
                    expect.fail();
                    Log.trace("inside test");
                })
                .catch(function (err) {
                    expect(err.status).to.deep.equal(400);
                });
        } catch (err) {
            Log.trace("add dataset unsuccessful");
        }
    });

    it("TEST PUT add a new dataset with rooms", function () {
        try {
            return chai.request(SERVER_URL)
                .put("/dataset/courses/rooms")
                .send(fs.readFileSync("./test/data/courses.zip"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: any) {
                    expect.fail();
                    Log.trace("inside test");
                })
                .catch(function (err) {
                    expect(err.status).to.deep.equal(400);
                });
        } catch (err) {
            Log.trace("add dataset unsuccessful");
        }
    });

    it("test valid query for courses", function () {
        try {
            let query = JSON.parse(fs.readFileSync("./test/newQueries/test1.json", "utf8"));
            return chai.request(SERVER_URL)
                .post("/query")
                .send(query)
                .then(function (res: any) {
                    // some logging here please!
                    Log.trace("inside test valid query");
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            Log.trace("fail to test valid query : " + err);
        }
    });

    it("test get dataset", function () {
        try {
            return chai.request(SERVER_URL)
                .get("/datasets")
                .then(function (res: any) {
                    Log.trace("inside test");
                    expect(res.status).to.deep.equal(200);
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            Log.trace("add dataset unsuccessful");
        }
    });

    it("test valid query for rooms", function () {
        try {
            let query = JSON.parse(fs.readFileSync("./test/newQueries/test3.json", "utf8"));
            return chai.request(SERVER_URL)
                .post("/query")
                .send(query)
                .then(function (res: any) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
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
            let query = JSON.parse(fs.readFileSync("./test/newQueries/test2.json", "utf8"));
            return chai.request(SERVER_URL)
                .post("/query")
                .send(query)
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

    it("test delete dataset", function () {
        try {
            return chai.request(SERVER_URL)
                .del("/dataset/courses")
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.deep.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            Log.trace("delete courses error : " + err);
        }
    });

    it("not able to perform when dataset is delete", function () {
        try {
            let query = JSON.parse(fs.readFileSync("./test/newQueries/test2.json", "utf8"));
            return chai.request(SERVER_URL)
                .post("/query")
                .send(query)
                .then(function (res: Response) {
                    // some logging here please!
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    expect(err.status).to.deep.equal(400);
                });
        } catch (err) {
            Log.trace("fail to test query without dataset : " + err);
        }
    });

    it("fail to delete dataset that already delete", function () {
        try {
            return chai.request(SERVER_URL)
                .del("/dataset/courses")
                .then(function (res: Response) {
                    // some logging here please!
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    expect(err.status).to.deep.equal(404);
                });
        } catch (err) {
            Log.trace("fail to test unsuccessful delete dataset : " + err);
        }
    });

    it("fail to delete dataset with wrong format", function () {
        try {
            return chai.request(SERVER_URL)
                .del("/dataset/")
                .then(function (res: Response) {
                    // some logging here please!
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    expect(err.status).to.deep.equal(400);
                });
        } catch (err) {
            Log.trace("fail to test unsuccessful delete dataset : " + err);
        }
    });

    it("test on static", function () {
        try {
            return chai.request(SERVER_URL)
                .get("/index.html")
                .then(function (res: any) {
                    expect(res.status).to.deep.equal(200);
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            //
        }
    });

    it("test on echo", function () {
        try {
            return chai.request(SERVER_URL)
                .get("/echo/shelley")
                .then(function (res: any) {
                    expect(res.status).to.deep.equal(200);
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            //
        }
    });

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
