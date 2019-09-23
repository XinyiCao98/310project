import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {relative} from "path";
import {type} from "os";
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
    private datasets: string[] = [];

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    // tslint:disable-next-line:max-func-body-length
    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        // check whether dataset ID is in right format
        if (id.includes("_") || id === "" || id === null) {
            return Promise.reject(new InsightError("ID in wrong format."));
        }
        // check whether dataset ID is already exists
        if (this.datasets.indexOf(id) < 0) {
            return Promise.reject(new InsightError("already existed"));
        }
        // check whether dataset ID is in correct InsightDatasetKind
        if (kind !== InsightDatasetKind.Courses) {
            return Promise.reject(new InsightError("ID is incorrect InsightDatasetKind."));
        }
        return new Promise((fulfill, reject) => {
            let currZip = new JSZip();
            const promiseArray: Array<Promise<string>> = [];
            // unzip my current zip file
            const that = this;
            currZip.loadAsync(content, {base64: true}).then(async function () {
                return currZip.folder("courses");
            }).catch(function (e) {
                reject(new InsightError("This is not a zip"));
            }).then(function (zipInfo: JSZip) {
                zipInfo.forEach(function (relativePath, file) {
                    try {
                        promiseArray.push(file.async("text"));
                    } catch {
                        reject(new InsightError("File not in JSON format"));
                    }
                });
                Promise.all(promiseArray).then(function (allJFile: any) {
                    for (const singleCourse of allJFile) {
                        let sectionArray = JSON.parse(singleCourse).result;
                        for (const singleSection of sectionArray) {
                            that.checkValidDataset(singleSection);
                        }
                    }
                    if (that.validSection.length === 0) {
                        reject(new InsightError("No valid section"));
                    } else {// These files should be saved to the <PROJECT_DIR>/data directory.
                        // Make sure not to commit these files to version control,
                        // as this may cause unpredicted test failures.
                        fs.writeFile("./data/" + id, JSON.stringify(that.validSection),
                            (e) => {
                                if (e !== null) {
                                    reject(new InsightError("Error occurs when saving to data"));
                                }
                            });
                        that.datasetMap.set(id, that.validSection);
                        that.datasetID.push(id);
                        fulfill(that.datasetID);
                        that.datasets.push(id);
                    }
                });
            });
        });
    }
    // Check the details of whether a section has all features
    private  checkValidDataset(singleSection: any) {
        try {
            if (typeof singleSection.Title === "string"
                && typeof singleSection.Section === "string"
                && typeof singleSection.id === "number"
                && typeof singleSection.Professor === "string"
                && typeof singleSection.Audit === "number"
                && typeof singleSection.Year === "string"
                && typeof singleSection.Course === "string"
                && typeof singleSection.Session === "string"
                && typeof singleSection.Pass === "number"
                && typeof singleSection.Fail === "number"
                && typeof singleSection.Avg === "number") {
                const title = singleSection.Title;
                const section = singleSection.Section;
                const cid = singleSection.id.toString();
                const professor = singleSection.Professor;
                const audit = singleSection.Audit;
                const year = parseInt(singleSection.Year, 10);
                const course = singleSection.Course;
                const session = singleSection.Session;
                const pass = singleSection.Pass;
                const fail = singleSection.Fail;
                const avg = singleSection.Avg;
                const validSec = new Map<string, number | string>([
                    ["title", title],
                    ["section", section],
                    ["cid", cid],
                    ["professor", professor],
                    ["audit", audit],
                    ["year", year],
                    ["course", course],
                    ["session", session],
                    ["pass", pass],
                    ["fail", fail],
                    ["avg", avg],
                ]);
                this.validSection.push(validSec);
            }
        } catch {
            // If an individual file is invalid for any reason, skip over it
        }
    }
    public removeDataset(id: string): Promise<string> {
        // check whether dataset ID is in right format
        if (id.includes("_") || id === "" || id === null) {
            return Promise.reject(new InsightError("ID in wrong format."));
        }
        // check whether dataset ID is already exists
        if (!this.datasetID.includes(id)) {
            return Promise.reject(new NotFoundError("ID is not exists."));
        }
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise <any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }
}
