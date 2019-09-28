import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import * as fs from "fs";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private datasetID: string[] = [];
    private datasetMap: Map<string, any[]> = new Map<string, any[]>();
    private validSection: any[] = [];
    private properties: string[] = ["courses_dept", "courses_id", "courses_avg", "courses_title",
        "courses_pass", "courses_fail", "courses_audit", "courses_uuid", "courses_year", "courses_instructor"];
    private NProperties: string[] = ["courses_avg", "courses_pass", "courses_fail", "courses_audit", "courses_year"];
    private SProperties: string[] = ["courses_dept", "courses_id",
        "courses_instructor", "courses_title", "courses_uuid"];

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
                // Log.trace("222");
                try {
                    // Log.trace("333");
                    if (typeof singleSection.Subject === "string" && typeof singleSection.Course === "string"
                        && typeof singleSection.Avg === "number" && typeof singleSection.Professor === "string"
                        && typeof singleSection.Title === "string" && typeof singleSection.Pass === "number"
                        && typeof singleSection.Fail === "number" && typeof singleSection.Audit === "number"
                        && typeof singleSection.id === "number" && typeof singleSection.Year === "string") {
                        const dept = singleSection.Subject; const id = singleSection.Course;
                        const avg = singleSection.Avg; const instructor = singleSection.Professor;
                        const title = singleSection.Title; const pass = singleSection.Pass;
                        const fail = singleSection.Fail; const audit = singleSection.Audit;
                        const uuid = singleSection.id.toString; const year = parseInt(singleSection.Year, 10);
                        const validSec = new Map<string, number | string>([
                            ["courses_dept", dept], ["courses_id", id],
                            ["courses_avg", avg], ["courses_instructor", instructor],
                            ["courses_title", title], ["courses_pass", pass],
                            ["courses_fail", fail], ["courses_audit", audit],
                            ["courses_uuid", uuid], ["courses_year", year]
                        ]);
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
        let Validornot = this.CheckQuery(query);
        let Output: string[] = ["KAIWEN"];
        if (!Validornot) {
            return Promise.reject(new InsightError("Invalid Query"));
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

    public CheckQuery(query: any): boolean {
        if (query == null || !query.hasOwnProperty("WHERE") || !query.hasOwnProperty("OPTIONS") ||
            !this.queryOrNot(query["WHERE"]) || !this.queryOrNot(query["OPTIONS"]) || // first layer has be queries
            Object.keys(query).length > 2 ||   // extra element in query
            query["WHERE"] == null ||          // nothing inside where
            Object.keys(query["OPTIONS"]).length > 2 || // extra element in option
            Object.keys(query["WHERE"]).length !== 1) { // extra element in where
            return false;
        }
        let where = query["WHERE"];
        let options = query["OPTIONS"];
        // Log.trace(itemsInCom);
        if (Object.keys(where).length === 0) {
            // TODO: Result too large ???
        }
        this.checkWhere(where);
        if (!Array.isArray(options["COLUMNS"]) || Array.isArray(options["ORDER"])) { // Order cannot be array
            return false; // columns has be array
        }
        let itemsInCOL: string[] = options["COLUMNS"]; // stuff inside columns
        for (const key of Object.keys(options)) { // check options has valid elements
            if (key === "COLUMNS") {
                return this.CheckCol(itemsInCOL);
            } else if (key === "ORDER" && typeof options["ORDER"] === "string") {
                return this.CheckOrd(itemsInCOL, options["ORDER"]);
            } else {
                return false;
            }
        }
    }

    public  checkWhere(where: any): boolean {
        let Comparator = Object.keys(where)[0];
        let itemsInCom = where[Comparator];
        if (Comparator === "EQ" || Comparator === "GT" || Comparator === "LT") {
            if (!this.CheckCWL(itemsInCom)) {
                return false;
            }
        } else if (Comparator === "IS") {
            if (!this.CheckIWL(itemsInCom)) {
                return false;
            }
        } else if (Comparator === "AND" || Comparator === "OR") {
            if (!this.CheckL(itemsInCom)) {
                return false;
            }
        } else if (Comparator === "NOT") {
            // TODO: Check Negation !!!
        } else {
            return false;
        }
    }
    // Check if input is a query e.g. {}
    public queryOrNot(q: any): boolean {
        if (typeof q === "string" || typeof q === "number" ||
            Array.isArray(q) || q === null) {
            return false;
        }
    }
    // Check the properties from Column are in given information or not
    public CheckCol(Col: string[]): boolean {
        let i: number = 0;
        if (Col.length > 0 || Col !== null) {
            for (i; i < Col.length; i++) {
                if (this.properties.indexOf(Col[i]) < 0) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }
    public CheckOrd(Col: string[], Ord: string): boolean { // Check if element inside order is valid
        if (Col === null || Col.indexOf(Ord) < 0) {
            return false;
        } else {
            return true;
        }
    }
    // Check Compare Statement without logic
    public CheckCWL(ItemInComparator: any): boolean {
        if (!this.queryOrNot(ItemInComparator)) {
            return false;
        }
        let Key = Object.keys(ItemInComparator).toString();
        let Values = Object.values(ItemInComparator);
        if (this.NProperties.indexOf(Key) < 0) {
            return false;
        }
        if (typeof Values !== "number") {
            return false;
        }
        return true;
    }
    public CheckIWL(ItemInComparator: any): boolean { // Check Is Statement without logic
        if (!this.queryOrNot(ItemInComparator) || Object.keys(ItemInComparator).length !== 1) {
            return false;
        }
        let Key = Object.keys(ItemInComparator).toString();
        let Values = Object.values(ItemInComparator);
        if (this.SProperties.indexOf(Key) < 0) {
            return false;
        }
        if (typeof Values !== "string") {
            return false;
        }
        return true;
    }
    public CheckL(ItemInComparator: any): boolean { // check AND || OR logic
        if (ItemInComparator === null || !Array.isArray(ItemInComparator) || ItemInComparator.length < 1) {
            return false;
        } else {
            for (let everyLogic of ItemInComparator) {
                if (!this.checkWhere(everyLogic) || Object.keys(everyLogic).length === 0) {
                    return false;
                }
            }
            return true;
        }
    }
}
