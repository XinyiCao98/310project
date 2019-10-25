import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "./IInsightFacade";
import * as JSZip from "jszip";
import * as fs from "fs";
import {CheckQueryHelper} from "./CheckQueryHelper";
import Datasets from "./Datasets";
import PerformQuery from "./PerformQuery";
import QueryTree from "./QueryTree";
import RoomHelper from "./RoomHelper";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
    private datasetID: string[] = [];
    private datasetMap: Map<string, any[]> = new Map<string, any[]>();
    private allKindsMap: Map<string, any> = new Map<string, any>();
    // private allKindsList: any [] = [];

    // private validSection: any[] = [];

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        // check whether dataset ID is in right format
        return new Promise((fulfill, reject) => {
                const currZip = require("jszip");
                try {
                    this.checkInput(id);
                } catch (e) {
                    reject(new InsightError(e));
                }
                // Log.trace("enter addDataset");
                if (kind === InsightDatasetKind.Courses) {
                    this.addCourse(id, content, currZip).then((response: string[]) => {
                        this.allKindsMap.set(id, kind);
                        return fulfill(response);
                    }, (response: string[]) => {
                        return reject(response);
                    });
                } else if (kind === InsightDatasetKind.Rooms) {
                    const roomHelper = new RoomHelper();
                    roomHelper.addRoom(id, content, currZip, this.datasetMap, this.datasetID)
                        .then((response: string[]) => {
                            this.allKindsMap.set(id, kind);
                            return fulfill(response);
                        }, (response: string[]) => {
                            return reject(response);
                        });
                } else {
                    return new InsightError("Invalid kind");
                }
                // Log.trace(this.datasetID);
            }
        );
    }

    public addCourse(id: string, content: string, currZip: JSZip): Promise<string[]> {
        return new Promise((fulfill, reject) => {
            let validSection: any[] = [];
            const promiseArray: Array<Promise<string>> = [];
            // unzip my current zip file
            const that = this;
            currZip.loadAsync(content, {base64: true}).then(function (zipInfo) {
                // Log.trace("before get folder " + id);
                zipInfo.folder("courses").forEach(function (relativePath, file) {
                    try {
                        // Log.trace("async path");
                        promiseArray.push(file.async("text"));
                    } catch {
                        reject(new InsightError("File cannot be converted to text"));
                    }
                });
                Promise.all(promiseArray).then(function (allJFile: any) {
                    validSection = that.checkValidDataset(allJFile, id);
                    if (validSection.length === 0) {
                        reject(new InsightError("No valid section"));
                    } else {
                        fs.writeFile("./data/" + id + ".json", JSON.stringify(validSection, null, " "),
                            (e) => {
                                if (e !== null) {
                                    reject(new InsightError("Error occurs when saving the data"));
                                }
                            });
                        that.datasetMap.set(id, validSection);
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

    private checkInput(id: string) {
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
    }

    // Check the details of whether a section has all features
    public checkValidDataset(allJFile: any, id: string): any[] {
        let validSection: any[] = [];
        for (const singleCourse of allJFile) {
            let sectionArray: any;
            try {
                sectionArray = JSON.parse(singleCourse)["result"];
            } catch (e) {
                continue;
            }
            for (const singleSection of sectionArray) {
                try {
                    if (this.checkselection(singleSection)) {
                        const dept = singleSection.Subject;
                        const cid = singleSection.Course;
                        const avg = singleSection.Avg;
                        const instructor = singleSection.Professor;
                        const title = singleSection.Title;
                        const pass = singleSection.Pass;
                        const fail = singleSection.Fail;
                        const audit = singleSection.Audit;
                        const uuid = singleSection.id.toString(10);
                        const year = this.getYear(singleSection);
                        let validSec: { [k: string]: number | string } = {
                            [id + "_dept"]: dept, [id + "_id"]: cid,
                            [id + "_avg"]: avg, [id + "_instructor"]: instructor,
                            [id + "_title"]: title, [id + "_pass"]: pass,
                            [id + "_fail"]: fail, [id + "_audit"]: audit,
                            [id + "_uuid"]: uuid, [id + "_year"]: year
                        };
                        validSection.push(validSec);
                        // Log.trace("add valid section successful");
                    }
                } catch {
                    // If an individual file is invalid for any reason, skip over it
                }
            }
        }
        return validSection;
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
        if (!this.allKindsMap.has(id)) {
            // reject(new NotFoundError("ID is not existed."));
            return Promise.reject(new NotFoundError("ID is not existed."));
        }
        return new Promise((fulfill, reject) => {
            let idx = this.datasetID.indexOf(id);
            if (this.allKindsMap.get(id) === InsightDatasetKind.Courses) {
                this.datasetMap.delete(id);
                this.datasetID.splice(idx, 1);
                this.datasetMap.delete(id);
            } else {
                this.datasetMap.delete(id);
            }
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
        let validorNot = helper.CheckQuery(query);
        let Output: any;
        if (!validorNot) {
            return Promise.reject(new InsightError("Invalid Query"));
        }
        const target = this.getQueryID(query);
        const datasets = new Datasets(this.datasetMap);
        datasets.getDatasets(target);
        const PQ = new PerformQuery(target);
        let ObjectArray = datasets.getData(target);
        if (ObjectArray === undefined) {
            return Promise.reject(new InsightError("Datasets not exists"));
        }
        // Log.trace(ObjectArray);
        let filter = query["WHERE"];
        let selection = query["OPTIONS"];
        let QueryTR = new QueryTree();
        let Qtree = QueryTR.buildQT(filter, selection);
        let Col = Qtree.Columns;
        let Ord = Qtree.Order;
        if (Object.keys(query["WHERE"]).length === 0 &&
            Object.keys(ObjectArray).length > 5000) {
            return Promise.reject(new ResultTooLargeError("ResultTooLargeError"));
        }
        if (Object.keys(query["WHERE"]).length === 0 &&
            Object.keys(ObjectArray).length <= 5000) {
            Output = PQ.PerformColumns(Col, ObjectArray);
            if (Object.keys(query["OPTIONS"]).length === 2) {
                Output = PQ.SortbyNP(Output, Ord);
            }
            return Promise.resolve(Output);
        }
        Output = PQ.GetResult(ObjectArray, Qtree);
        Output = PQ.PerformColumns(Col, Output);
        if (Object.keys(query["OPTIONS"]).length === 2) {
            Output = PQ.SortbyNP(Output, Ord);
        }
        // if (Output === false) { return Promise.reject(new InsightError("wrong format")); }
        Output = PQ.PerformColumns(Col, Output);
        if (Output.length > 5000) {
            return Promise.reject(new ResultTooLargeError("ResultTooLargeError"));
        }
        return Promise.resolve(Output);
    }

    public getQueryID(query: any): string {
      const CheckQhelper = new CheckQueryHelper();
      let filtered = CheckQhelper.ElementInColFiltered(query);
      let uniqueID = filtered[0].split("_")[0];
      Log.trace(uniqueID);
      return uniqueID;
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise<InsightDataset[]>((fulfill, reject) => {
            let presentList: any[] = [];
            for (let id of this.datasetID) {
                presentList.push({id, kind: this.allKindsMap.get(id), numRows: this.datasetMap.get(id).length});
            }
            fulfill(presentList);
        });
    }

    public checkselection(singleSection: any): boolean {
        if (typeof singleSection.Subject === "string" && typeof singleSection.Course === "string"
            && typeof singleSection.Avg === "number" && typeof singleSection.Professor === "string"
            && typeof singleSection.Title === "string" && typeof singleSection.Pass === "number"
            && typeof singleSection.Fail === "number" && typeof singleSection.Audit === "number"
            && typeof singleSection.id === "number" && typeof singleSection.Year === "string") {
            return true;
        }
        return false;
    }

    public getYear(singleSection: any): number {
        if (singleSection.Section === "overall") {
            return 1900;
        }
        let output = parseInt(singleSection.Year, 10);
        return output;
    }
}
