
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
    private  NProperties: string[] = ["courses_avg", "courses_pass", "courses_fail", "courses_audit", "courses_year" ];
    private  SProperties: string[] = ["courses_dept", "courses_id",
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
                    Log.trace("Empty promise list");
                    reject(new InsightError("This is no item in promise list"));
                });
            }).catch(function (e) {
                Log.trace("not zip");
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
                    if (typeof singleSection.Subject === "string"
                        && typeof singleSection.Course === "string"
                        && typeof singleSection.Avg === "number"
                        && typeof singleSection.Professor === "string"
                        && typeof singleSection.Title === "string"
                        && typeof singleSection.Pass === "number"
                        && typeof singleSection.Fail === "number"
                        && typeof singleSection.Audit === "number"
                        && typeof singleSection.id === "number"
                        && typeof singleSection.Year === "string") {
                        const dept = singleSection.Subject;
                        const id = singleSection.Course;
                        const avg = singleSection.Avg;
                        const instructor = singleSection.Professor;
                        const title = singleSection.Title;
                        const pass = singleSection.Pass;
                        const fail = singleSection.Fail;
                        const audit = singleSection.Audit;
                        const uuid  = singleSection.id.toString;
                        const year  = parseInt(singleSection.Year, 10);
                        const validSec = new Map<string, number | string>([
                            ["courses_dept", dept],
                            ["courses_id", id],
                            ["courses_avg", avg],
                            ["courses_instructor", instructor],
                            ["courses_title", title],
                            ["courses_pass", pass],
                            ["courses_fail", fail],
                            ["courses_audit", audit],
                            ["courses_uuid", uuid],
                            ["courses_year", year]

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

    public performQuery(query: any): Promise <any[]> {
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
    public CheckQuery (query: any): boolean {
      if (query == null ||
          !query.hasOwnProperty("WHERE") ||
          !query.hasOwnProperty("OPTIONS")
      || query["WHERE"] == null ||
      Object.keys(query["OPTIONS"]).length > 2 ||
      Object.keys(query["WHERE"]).length !== 1) {
      return false; }
      let where = query["WHERE"];
      let Comparator = Object.keys(where)[0];
      let itemsInCom = where[Comparator];
      // Log.trace(itemsInCom);
      if (Comparator === "EQ" ||
          Comparator === "GT" ||
          Comparator === "LT") {
          if (!this.CheckCWL(itemsInCom)) {return false; }

      }
      if (Comparator === "IS") {
          if (!this.CheckIWL(itemsInCom)) {return true; }
      }
      if (!query["OPTIONS"].hasOwnProperty("COLUMNS") ||
          query["OPTIONS"]["COLUMNS"].length <= 0
          || query["OPTIONS"]["COLUMNS"] == null ) {
          return false; }
      let itemsinCOL: string[] = query["OPTIONS"]["COLUMNS"];
      if (!this.CheckCol(itemsinCOL)) {
          return false; }
      if (query["OPTIONS"].hasOwnProperty("ORDER")) {
              if (query["OPTIONS"]["ORDER"] == null
              || !this.CheckOrd(itemsinCOL, query["OPTIONS"]["ORDER"])) {
                  return false;
          }
      }
      return true;

      }

      public CheckCol(Col: string[]): boolean {
        let m: number = Col.length;
        let i: number = 0;
        for (i; i < m ; i++) {
            if (this.properties.indexOf(Col[i]) < 0) {
                return false;
            }}

        return true; }
        public  CheckOrd (Col: string[], Ord: string): boolean {
        if (Col.indexOf(Ord) < 0) {return false; }
        return true; }
       // Check Compare Statement without logic
     public  CheckCWL (ItemInComparator: any): boolean {
      if (ItemInComparator === null) {
          return false; }
      let Bool = Array.isArray(ItemInComparator);
      let Key = Object.keys(ItemInComparator).toString();
      let Values = Object.values(ItemInComparator);
      if (Bool) {return false; }
      if (this.NProperties.indexOf(Key) < 0) {return  false; }
      if ( typeof Values !== "number") { return false; }
      return true;

     }
     public CheckIWL (ItemInComparator: any): boolean {
        if (ItemInComparator === null) {
            return false;
        }
        let Bool = Array.isArray(ItemInComparator);
        let Key = Object.keys(ItemInComparator).toString();
        let Values = Object.values(ItemInComparator);
        if (Bool) {return false; }
        if (this.SProperties.indexOf(Key) < 0 ) { return false; }
        if (typeof Values !== "string") { return false; }
        return true;
     }
}
