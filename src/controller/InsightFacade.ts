import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {relative} from "path";
import {type} from "os";
import * as fs from "fs";
import {rejects} from "assert";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private datasets: string[] = [];
    private CourseMap: Map<string , any> = new  Map<string, any>();
    private VS: any[];
    private IDS: string[] = [];

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    // tslint:disable-next-line:max-func-body-length
    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {

            // tslint:disable-next-line:no-empty
            let zip = new JSZip();
            const PromiseArray: Array <Promise<string>> = [];
            if (!this.CheckId(id)) {
                return Promise.reject(new InsightError("invalid id"));
            }
            if (this.datasets.indexOf(id) >= 0) {
                return Promise.reject(new InsightError("already added"));
            }
            // check whether dataset ID is in correct InsightDataSet Kind
            if (kind! !== InsightDatasetKind.Courses) {
                return Promise.reject(new InsightError("Wrong InsightDataSet"));
            }
            try {
                zip.loadAsync(content, {base64: true});
                // tslint:disable-next-line:align no-empty
            } catch (e) {
                return Promise.reject(new InsightError("not correct format"));
            }
            return zip.loadAsync(content, {base64: true}).then(function (zipInformation: JSZip) {
                zipInformation.forEach(function (relativePath, file) {
                    try {
                        PromiseArray.push(file.async("text"));
                    } catch (e) {
                        return Promise.reject(new InsightError("FILE NOT IN JSON FORMAT"));
                    }
                });
                return Promise.all(PromiseArray).then(function (allJsonF: any) {
                    for (const singleC of allJsonF) {
                        let ArrayOfSection = singleC.parse().result;
                        for (const singleSection of ArrayOfSection) {
                            // tslint:disable-next-line:no-unused-expression
                            this.AnalyzeDataset(singleSection);
                        }
                    }
                    if (this.VS.length === 0)  {
                        return Promise.reject("NO Valid Section Exists");
                    } else {
                        fs.writeFile("./data/" + id, JSON.stringify(this.VS),
                            (e) => {
                                if (e !== null) {
                                    return Promise.reject("Fail to save Data");
                                }
                                this.CourseMap.set(id, this.VS);
                                this.IDS.push(id);
                                this.datasets.push(id);
                                return Promise.resolve(this.datasets);
                            });
                    }
                }).catch();
            }); }

    public removeDataset(id: string): Promise<string> {
        // check whether dataset ID is in right format
        if (id.includes("_") || id === "" || id === null) {
            return Promise.reject(new InsightError("ID in wrong format."));
        }
        // check whether dataset ID is already exists
        if (!this.datasets.includes(id)) {
            return Promise.reject(new NotFoundError("ID is not exists."));
        }
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise <any[]> {
        return Promise.reject("Not implemented."); }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }
    public CheckId (id: string): boolean {
        if (id === null) {
            return false; }
        if (id.includes("_")) {
            return false;
        }
        if (!id.replace(/\s/g, "").length) {
            return  false;
        }
        return true;
    }
    public AnalyzeDataset (SingleSection: any ): void {
        if    (typeof SingleSection.Title === "string"
            && typeof SingleSection.Section === "string"
            && typeof SingleSection.Avg === "number"
            && typeof SingleSection.Professor === "string"
            && typeof SingleSection.Subject === "string"
            && typeof SingleSection.Pass === "number"
            && typeof SingleSection.Fail === "number"
            && typeof SingleSection.Audit === "string"
            && typeof SingleSection.id === "number"
            && typeof SingleSection.Year === "number") {
            let dept = SingleSection.Subject;
            let id    = SingleSection.Section;
            let avg   = SingleSection.Avg;
            let instructor = SingleSection.Professor;
            let title = SingleSection.Title;
            let pass  = SingleSection.Pass;
            let fail  = SingleSection.Fail;
            let audit = SingleSection.Audit;
            let uuid = SingleSection.id;
            let year = SingleSection.Year;
            let ValidSec = new Map<string, number|string>([
                ["courses_dept", dept],
                ["course_id", id],
                ["courses_avg", avg],
                ["courses_instructor", instructor],
                ["courses_title", title],
                ["courses_pass", pass],
                ["courses_fail", fail],
                ["courses_audit", audit],
                ["courses_uuid", uuid],
                ["courses_year", year]
            ]);
            this.VS.push(ValidSec);

        }
    }
}
