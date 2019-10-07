import {expect} from "chai";
import * as fs from "fs-extra";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        courses_: "./test/data/courses_.zip",
        emptyDataset: "./test/data/emptyDataset.zip",
        emptyFile: "./test/data/emptyFile.zip",
        manyFolder: "./test/data/manyFolder.zip",
        notCourses: "./test/data/notCourses.zip",
        notZip: "./test/data/notZip.pdf",
        wrongContentPdf: "./test/data/wrongContentPdf.zip",
        wrongContentPic: "./test/data/wrongContentPic.zip",
        noInfoCourse: "./test/data/noInfoCourse.zip",
        manyFile: "./test/data/manyFile.zip",
        noValidCourse: "./test/data/noValidCourse.zip",
        oneValid: "./test/data/oneValid.zip",
        brokenJSON: "./test/data/brokenJSON.zip",
        nestedFolder: "./test/data/nestedFolder.zip",
        removeButValid: "./test/data/removeButValid.zip",
        smallvalid : "./test/data/smallvalid.zip"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // This is a unit test. You should create more like this!
    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);

        }).catch((err: any) => {
            Log.error(err);
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    it("Should add a valid dataset2", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);

        }).catch((err: any) => {
            Log.error(err);
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    it("succeed to add two dataset", function () {
        const id1: string = "courses";
        const id2: string = "manyFolder";
        let expected1: string[] = [id1];
        let expected2: string[] = [id1, id2];
        return insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected1);
            insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses).

            then((result2: string[]) => {
                expect(result2).to.deep.equal(expected2);
            }).catch((err: any) => {
                expect.fail(err, expected2, "Should not have rejected1");
            });
        }).catch((err: any) => {
            expect.fail(err, expected1, "Should not have rejected2");
        });
    });

    it("list dataset #0 with one valid dataset", function () {
        const id: string = "courses";
        let expected2: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result2: InsightDataset[]) => {
            expect(result2[0].id).to.deep.equal(id);
            expect(result2.length).to.deep.equal(1);
        }).catch((error: any) => {
            expect.fail(error, expected2, "Should not have rejected");
        });
    });

    it("list dataset #1 with no dataset inside", function () {
        return insightFacade.listDatasets().then((result: InsightDataset[]) => {
            expect(result.length).to.deep.equal(0);
        });
    });

    it("list dataset #2 with two valid dataset", function () {
        const id: string = "courses";
        const id2: string = "oneValid";
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses).
            then((result2: string[]) => {
                return insightFacade.listDatasets();
            }).then((result3: InsightDataset[]) => {
                expect(result3[0].id).to.deep.equal(id);
                expect(result3[1].id).to.deep.equal(id2);
                expect(result3.length).to.deep.equal(2);
            }).catch((error: any) => {
                expect.fail(error, expected, "Should not have rejected this");
            });
        });
    });
    it("fail to add dataset with id underscore", function () {
        const id: string = "courses_";
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("fail to add dataset with id whitespace", function () {
        const id: string = " ";
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("fail to add dataset with empty string", function () {
        const id: string = "";
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    /*
    it("fail to add dataset with nested folder", function () {
        const id: string = "nestedFolder";
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    */

    it("fail to add dataset with existing id", function () {
        const id: string = "courses";
        const id2: string = "courses";
        let expected2: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        }).then((result2: string[]) => {
            expect.fail(result2, expected2, "Should have rejected");
        }).catch((error: any) => {
            // Log.error(error);
            expect(error).to.be.instanceOf(InsightError);
        });
    });

    it("fail to add dataset with id is null", function () {
        const id: string = null;
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("fail to add dataset with broken JSON", function () {
        const id: string = "brokenJSON";
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    // nothing in the folder
    it("fail to add dataset with nothing in zip file", function () {
        const id: string = "emptyDataset";
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("fail to add dataset that is not a zip file", function () {
        const id: string = "notZip";
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("fail to add dataset that contains picture", function () {
        const id: string = "wrongContentPic";
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("fail to add dataset that contains pdf", function () {
        const id: string = "wrongContentPdf";
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    // nothing in the file
    it("fail to add dataset that file is empty", function () {
        const id: string = "emptyFile";
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("fail to add dataset with different InsightDatasetKind", function () {
        const id: string = "courses";
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("fail to add dataset that file is not courses (e.g. name[coursess]", function () {
        const id: string = "notCourses";
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("succeed to add dataset that have many folder", function () {
        const id: string = "manyFolder";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });
    it("succeed to add dataset with two courses", function () {
        const id: string = "smallvalid";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("succeed to add dataset that removed unnecessary info", function () {
        const id: string = "removeButValid";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("fail to add dataset that no course information", function () {
        const id: string = "noInfoCourse";
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("fail to add dataset that no valid course information", function () {
        const id: string = "noValidCourse";
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("succeed to add dataset with other files", function () {
        const id: string = "manyFile";
        let expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("succeed to add dataset with one valid section", function () {
        const id: string = "oneValid";
        let expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("fail to remove dataset if dataset is not yet added", function () {
        const id: string = "courses";
        let expected: string[];
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(NotFoundError);
        });
    });

    it("succeed to remove two valid dataset", function () {
        const id: string = "courses";
        const id2: string = "oneValid";
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses).
            then((result2: string[]) => {
                return insightFacade.removeDataset(id).then((result3: string) => {
                    return insightFacade.removeDataset(id2).then((result4: string) => {
                        return insightFacade.listDatasets();
                    }).then((result5: InsightDataset[]) => {
                        expect(result5.length).to.deep.equal(0);
                    }).catch((error: any) => {
                        expect.fail(error, expected, "Should not have rejected this");
                    });
                });
            });
        });
    });

    it("succeed to remove one valid dataset under two valid dataset", function () {
        const id: string = "courses";
        const id2: string = "manyFolder";
        let expected: string[] = [id2];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses).
            then((result2: string[]) => {
                return insightFacade.removeDataset(id).then((result3: string) => {
                    return insightFacade.listDatasets();
                }).then((result4: InsightDataset[]) => {
                    expect(result4[0].id).to.deep.equal(id2);
                    expect(result4.length).to.deep.equal(1);
                }).catch((error: any) => {
                    expect.fail(error, expected, "Should not have rejected this");
                });
            });
        });
    });

    it("fail to remove a valid dataset with id whitespace", function () {
        const id: string = " ";
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.removeDataset(id);
        }).then((result2: string) => {
            expect.fail(result2, expected, "Should have rejected because of whitespace");
        }).catch((error: any) => {
            expect(error).to.be.instanceOf(InsightError);
        });
    });

    it("fail to remove a valid dataset with id underscore", function () {
        const id: string = "courses_";
        let expected: string[];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.removeDataset(id);
        }).then((result2: string) => {
            expect.fail(result2, expected, "Should have rejected because of whitespace ");
        }).catch((error: any) => {
            expect(error).to.be.instanceOf(InsightError);
        });
    });

    it("fail to remove a valid dataset with id null", function () {
        const id: string = null;
        let expected: string[];
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("fail to remove a valid dataset with wrong id", function () {
        const id: string = "courses";
        let expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.removeDataset("manyFolder");
        }).then((result2: string) => {
            expect.fail(result2, expected, "Should have rejected because of wrong id ");
        }).catch((error: any) => {
            expect(error).to.be.instanceOf(NotFoundError);
        });
    });
});
//////////////////////////////////////////
/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: any } = {
        courses: {id: "courses", path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
    };
    let insightFacade: InsightFacade = new InsightFacade();
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        for (const key of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[key];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(ds.id, data, ds.kind));
            Log.trace("ADDING!!!!!!!!!!");
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * For D1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    insightFacade.performQuery(test.query).then((result) => {
                        TestUtil.checkQueryResult(test, result, done);
                    }).catch((err) => {
                        TestUtil.checkQueryResult(test, err, done);
                    });
                });
            }
        });
    });
});
