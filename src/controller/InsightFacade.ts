import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "./IInsightFacade";
import * as fs from "fs";
import CheckQueryHelper from "./CheckQueryHelper";
import Datasets from "./Datasets";
import PerformQuery from "./PerformQuery";
import QueryTree from "./QueryTree";
import RoomHelper from "./RoomHelper";
import PerformTransHelper from "./PerformTransHelper";
import CourseHelper from "./CourseHelper";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
    private datasetID: string[];
    private datasetMap: Map<string, any[]>;
    private validDataSet: any[];
    private allKindsMap: Map<string, any>;

    constructor() {
        this.datasetID = [];
        this.allKindsMap = new Map<string, any>();
        this.datasetMap = new Map<string, any[]>();
        this.validDataSet = [];
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        // check whether dataset ID is in right format
        return new Promise((fulfill, reject) => {
                const courseHelper = new CourseHelper();
                const roomHelper = new RoomHelper();
                const currZip = require("jszip");
                try {
                    this.checkInput(id);
                } catch (e) {
                    return reject(new InsightError(e));
                }
                if (kind === InsightDatasetKind.Courses) {
                    courseHelper.addCourse(id, content, currZip, this.datasetMap, this.datasetID)
                        .then((response: string[]) => {
                            this.allKindsMap.set(id, kind);
                            return fulfill(response);
                        }, (response: string[]) => {
                            return reject(response);
                        });
                } else if (kind === InsightDatasetKind.Rooms) {
                    roomHelper.addRoom(id, content, currZip, this.datasetMap, this.datasetID)
                        .then((response: string[]) => {
                            this.allKindsMap.set(id, kind);
                            return fulfill(response);
                        }, (response: string[]) => {
                            return reject(response);
                        });
                } else {
                    return reject(new InsightError("Invalid kind"));
                }
            }
        );
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
        // const exist: boolean = fs.existsSync("./data/" + id);
        if (!this.datasetMap.has(id)) {
            // reject(new NotFoundError("ID is not existed."));
            return Promise.reject(new NotFoundError("ID is not existed."));
        }
        return new Promise((fulfill, reject) => {
            let idx = this.datasetID.indexOf(id);
            this.datasetMap.delete(id);
            this.datasetID.splice(idx, 1);
            this.allKindsMap.delete(id);
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
        // const transHelp = new PerformTransHelper();
        let validOrNot = helper.CheckQuery(query);
        let Output: any;
        if (!validOrNot) {
            return Promise.reject(new InsightError("Invalid Query"));
        }
        const target = this.getQueryID(query);
        if (!this.getDatasets(target)) {
            return Promise.reject(new InsightError("Write to disk error"));
        }
        const PQ = new PerformQuery(target);
        let ObjectArray = JSON.parse(JSON.stringify(this.getData(target)));
        const transHelp = new PerformTransHelper();
        // let ObjectArray = transHelp.datasetArray;
        if (ObjectArray === undefined) {
            return Promise.reject(new InsightError("Datasets not exists"));
        }
        let QueryTR = new QueryTree();
        let trans = "NO TRANSFORMATIONS";
        if (query.hasOwnProperty("TRANSFORMATIONS")) {
            trans = query["TRANSFORMATIONS"];
        }
        let Qtree = QueryTR.buildQT(query, trans);
        if (Object.keys(query["WHERE"]).length === 0 &&
            Object.keys(ObjectArray).length <= 5000) {
            Output = PQ.PerformColumns(Qtree.Columns, ObjectArray);
            if (Object.keys(query["OPTIONS"]).length === 2) {
                Output = PQ.Order(Output, Qtree.Order);
            }
            return Promise.resolve(Output);
        }
        Output = PQ.GetResult(ObjectArray, Qtree, query);
        if (query.hasOwnProperty("TRANSFORMATIONS")) {
            Output = transHelp.performTrans(Output, Qtree.Group, Qtree.Apply);
        }
        Output = PQ.PerformColumns(Qtree.Columns, Output);
        if (Object.keys(query["OPTIONS"]).length === 2) {
            Output = PQ.Order(Output, Qtree.Order);
        }
        Output = PQ.PerformColumns(Qtree.Columns, Output);
        if (Output.length > 5000) {
            return Promise.reject(new ResultTooLargeError("ResultTooLargeError"));
        }
        return Promise.resolve(Output);
    }

    public getQueryID(query: any): string {
        const CheckQhelper = new CheckQueryHelper();
        let filtered = CheckQhelper.ElementInColFiltered(query);
        if (filtered.length > 0) {
            return filtered[0].split("_")[0];
        } else {
            let GROUP: string[] = [];
            GROUP = query["TRANSFORMATIONS"]["GROUP"];
            let property = GROUP[0];
            return property.split("_")[0];
        }
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

    public getDatasets(DataId: string): boolean {
        try {
            if (!this.datasetMap.has(DataId)) {
                // dataset not exists in map
                const Data = fs.readFileSync("./data/" + DataId + ".json", "utf8");
                this.datasetID.push(DataId);
                this.datasetMap.set(DataId, JSON.parse(Data));
                // try {
                //     this.datasetID.push(DataId);
                //     this.datasetMap.set(DataId, JSON.parse(Data));
                // } catch (err) {
                //     this.datasetMap = new Map<string, object[]>();
                // }
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    public getData(DataId: string): any {
        return this.datasetMap.get(DataId);
    }
}
