import Log from "../Util";
import {IInsightFacade, InsightCourses, InsightDataset,
    InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import * as fs from "fs";
import {CheckQueryHelper} from "./CheckQueryHelper";
import * as DS from "./Datasets";
import Datasets from "./Datasets";
import PerformQuery from "./PerformQuery";
import QueryTree from "./QueryTree";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
    private datasetID: string[] = [];
    private datasetMap: Map<string, any[]> = new Map<string, any[]>();
    private validSection: any[] = [];

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        // check whether dataset ID is in right format
        return new Promise((fulfill, reject) => {
            try {
                this.checkInput(id, kind);
            } catch (e) {
                reject(new InsightError(e));
            }
            let currZip = new JSZip();
            const promiseArray: Array<Promise<string>> = [];
            // unzip my current zip file
            const that = this;
            currZip.loadAsync(content, {base64: true}).then(function (zipInfo) {
                currZip.folder("courses");
                zipInfo.forEach(function (relativePath, file) {
                    try {
                        promiseArray.push(file.async("text"));
                    } catch {
                        reject(new InsightError("File cannot be converted to text"));
                    }
                });
                Promise.all(promiseArray).then(function (allJFile: any) {
                    // Log.trace("3");
                    that.checkValidDataset(allJFile);
                    if (that.validSection.length === 0) {
                        reject(new InsightError("No valid section"));
                    } else {
                        // Log.trace("4");
                        fs.writeFile("./data/" + id + ".json", JSON.stringify(that.validSection, null, " "),
                            (e) => {
                                if (e !== null) {
                                    reject(new InsightError("Error occurs when saving to data"));
                                }
                            });
                        that.datasetMap.set(id, that.validSection);
                        that.datasetID.push(id);
                        fulfill(that.datasetID);
                    }
                }).catch(function (e) {
                    // Log.trace("Empty promise list");
                    reject(new InsightError("This is no item in promise list"));
                });
            }).catch(function (e) {
                // Log.trace("not zip");
                reject(new InsightError("This is not a zip"));
            });
        });
    }
    private checkInput(id: string, kind: InsightDatasetKind) {
        // check whether dataset ID is in right format
        if (!id || id.length === 0) {
            throw new InsightError("ID is empty or undefined.");
        }
        if (id.includes("_") || id === " ") {
            throw new InsightError("ID is whitespace or underscore.");
        }
        // check whether dataset ID is already exists
        if (this.datasetID.indexOf(id) >= 0) {
            throw new InsightError("ID is already existed.");
        }
        // check whether dataset ID is in correct InsightDatasetKind
        if (kind !== InsightDatasetKind.Courses) {
            throw new InsightError("ID is incorrect InsightDatasetKind.");
        }
    }
    // Check the details of whether a section has all features
    private checkValidDataset(allJFile: any) {
        for (const singleCourse of allJFile) {
            let sectionArray: any;
            try {
                // Log.trace("111");
                sectionArray = JSON.parse(singleCourse)["result"];
            } catch (e) {
                continue;
            }
            for (const singleSection of sectionArray) {
                try {
                    if (typeof singleSection.Subject === "string" && typeof singleSection.Course === "string"
                        && typeof singleSection.Avg === "number" && typeof singleSection.Professor === "string"
                        && typeof singleSection.Title === "string" && typeof singleSection.Pass === "number"
                        && typeof singleSection.Fail === "number" && typeof singleSection.Audit === "number"
                        && typeof singleSection.id === "number" && typeof singleSection.Year === "string") {
                        const dept = singleSection.Subject; const id = singleSection.Course;
                        const avg = singleSection.Avg; const instructor = singleSection.Professor;
                        const title = singleSection.Title; const pass = singleSection.Pass;
                        const fail = singleSection.Fail; const audit = singleSection.Audit;
                        const uuid = singleSection.id.toString; let year = parseInt(singleSection.Year, 10);
                        if (singleSection.Section === "overall") {
                            year = 1990;
                        }
                        let validSec: InsightCourses = {
                            courses_dept: dept, courses_id: id,
                            courses_avg: avg, courses_instructor: instructor,
                            courses_title: title, courses_pass: pass,
                            courses_fail: fail, courses_audit: audit,
                            courses_uuid: uuid, courses_year: year
                        };
                        this.validSection.push(validSec);
                    }
                } catch {
                    // If an individual file is invalid for any reason, skip over it
                }
            }
        }
    }
    public removeDataset(id: string): Promise<string> {
        // check whether dataset ID is in right format
        if (!id || id.length === 0) {
            // reject(new InsightError("ID is empty or undefined."));
            return Promise.reject(new InsightError("ID is empty or undefined."));
        }
        if (id.includes("_") || id === " ") {
            // reject(new InsightError("ID is whitespace or underscore."));
            return Promise.reject(new InsightError("ID is whitespace or underscore."));
        }
        // check whether dataset ID is exists
        // Log.trace("1");
        if (this.datasetID.indexOf(id) < 0) {
            // Log.trace("2");
            // reject(new NotFoundError("ID is not existed."));
            return Promise.reject(new NotFoundError("ID is not existed."));
        }
        return new Promise((fulfill, reject) => {
            // Log.trace("3");
            let idx = this.datasetID.indexOf(id);
            this.datasetID.splice(idx, 1);
            this.datasetMap.delete(id);
            fs.unlink("./data/" + id + ".json", (e) => {
                if (e !== null) {
                    reject(new InsightError("Unable to delete dataset"));
                } else {
                    fulfill(id);
                }
            });
        });
    }
    public performQuery(query: any): Promise<any[]> {
        const helper = new CheckQueryHelper();
        let Validornot = helper.CheckQuery(query);
        let Output: object[] = [ { KAIWEN: "zhenbang"}];
        if (!Validornot) {
            return Promise.reject(new InsightError("Invalid Query"));
        }
        const datasets = new Datasets();
        datasets.getDatasets("courses");
        let ObjectArray = datasets.getData("courses");
        let filter = query["WHERE"];
        let selection = query["OPTIONS"];
        let QueryTR = new QueryTree();
        let Qtree = QueryTR.buildQT(filter, selection);
        let Col = Qtree.Columns;
        let Ord = Qtree.Order;
        const PQ = new PerformQuery();
        const performQuery = new PerformQuery();
        if (query["WHERE"].length === 0) {
            return Promise.reject(new InsightError("ResultTooLarge"));
        }
        if (Qtree.nodeType === "IS") {
            let key = Qtree.nodeProperty;
            let value = Qtree.nodeValue;
            Output = performQuery.PerformIS(key, value, ObjectArray);
        }
        if (Qtree.nodeType === "EQ") {
            let key = Qtree.nodeProperty;
            let value = Qtree.nodeValue;
            Output = performQuery.PerformEQ(key, value, ObjectArray);
        }
        if (Qtree.nodeType === "GT") {
            let key = Qtree.nodeProperty;
            let value = Qtree.nodeValue;
            Output = performQuery.PerformGT(key, value, ObjectArray);
        }
        if (Qtree.nodeType === "LT") {
            let key = Qtree.nodeProperty;
            let value = Qtree.nodeValue;
            Output = performQuery.PerformLT(key, value, ObjectArray);
        }
        Output = PQ.PerformColumns(Col, Output);
        if (Object.keys(query["OPTIONS"]).length === 2) {
         Output = PQ.SortbyNP(Output, Ord);
        }
        if (Output.length > 5000) {
            return Promise.reject(new InsightError("ResultTooLarge"));
        }
        return Promise.resolve(Output);
 }
    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise<InsightDataset[]>((fulfill, reject) => {
            let presentList: any[] = [];
            for (let id of this.datasetID) {
                presentList.push({id, kind: InsightDatasetKind.Courses, numRows: this.datasetMap.get(id).length});
            }
            fulfill(presentList);
        });
    }
    public checktype (one: any): boolean {
        if (typeof one === "number" ) {
            return true;
        }
        return false;
    }
}
