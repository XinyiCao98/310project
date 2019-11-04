import {InsightError} from "./IInsightFacade";
import * as fs from "fs";
import Log from "../Util";
import * as JSZip from "jszip";

export default class RoomHelper {

    constructor() {
        //
    }

    public addCourse(id: string, content: string, currZip: JSZip,
                     datasetMap: Map<string, any[]>, datasetID: string[]): Promise<string[]> {
        return new Promise((fulfill, reject) => {
            let validSection: any[] = [];
            const promiseArray: Array<Promise<string>> = [];
            // unzip my current zip file
            const that = this;
            currZip.loadAsync(content, {base64: true}).then(function (zipInfo) {
                zipInfo.folder("courses").forEach(function (relativePath, file) {
                    try {
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
                        datasetMap.set(id, validSection);
                        datasetID.push(id);
                        fulfill(datasetID);
                    }
                }).catch(function (e) {
                    reject(new InsightError("This is no item in promise list"));
                });
            }).catch(function (e) {
                reject(new InsightError("This is not a zip"));
            });
        });
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
                    if (this.checkSelection(singleSection)) {
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
                    }
                } catch {
                    // If an individual file is invalid for any reason, skip over it
                }
            }
        }
        return validSection;
    }

    public checkSelection(singleSection: any): boolean {
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
        return parseInt(singleSection.Year, 10);
    }
}
