import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import PerformQuery from "../controller/PerformQuery";
import Log from "../Util";
import PerformOrderHelper from "../controller/PerformOrderHelper";

export default class Scheduler implements IScheduler {

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        // TODO Implement this
        let sortedRoom = this.sortHelper(rooms, "maxSeats"); // TODO: 不确定
        let scheduled = [];
        let toBeSchedule = sections;
        let result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];

        for (let singleRoom of sortedRoom) { // check one room at a time until all qualified courses filled
            let timeTable: Map<string, boolean> = new Map<string, boolean>();
            this.setSchedule(timeTable);

            let done: boolean = false;
            while (!done) {
                let target;
                if (toBeSchedule === null) {
                    return result;
                }
                target = this.getLargestSec(toBeSchedule, singleRoom["rooms_seats"]);
                if (target !== false) {
                    if (this.checkroomAvailable(timeTable) !== false
                        && this.checkNoDuplicateSec(target, scheduled)) {
                        scheduled.push(target);
                        let time: TimeSlot = this.checkroomAvailable(timeTable);
                        result.push([singleRoom, target, time]);
                        rooms.splice(toBeSchedule.indexOf(target), 1);
                    } else { // no more schedule to fit
                        done = true;
                        Log.trace("Room schedule is all full");
                        break;
                    }
                } else {
                    done = true;
                    break;
                }
            }
        }
        return result;
    }

    public sortHelper(Expected: SchedRoom[], keys: string): SchedRoom[] {
        let initialKey = keys;
        let result: SchedRoom[];
        let Original = this.OrderByString(Expected, initialKey);
        result = this.Reverse(Original);
        return result;
    }

    public Reverse(Original: SchedRoom[]): SchedRoom[] {
        let reverse: SchedRoom[] = [];
        let n = Object.keys(Original).length;
        for (let i: number = n - 1; i >= 0; i --) {
            reverse.push(Original[i]);
        }
        return reverse;
    }

    public OrderByString(Expected: SchedRoom[], Key: string): SchedRoom[] {
        let cfirst: { [key: string]: any };
        let csecond: { [key: string]: any };
        Expected.sort((cone, ctwo) => {
            cfirst = cone;
            csecond = ctwo;
            if (cfirst[Key] > csecond[Key]) {
                return 1;
            }
            if (cfirst[Key] < csecond [Key]) {
                return -1;
            }
            return 0;
        });
        return Expected;
    }

    public checkNoDuplicateSec(target: SchedSection, scheduled: any[]): boolean {
        let targetDept: string = target["courses_dept"];
        let targetUuid: string = target["courses_uuid"];
        for (let already of scheduled) {
            let schedDept: string = already["courses_dept"];
            let schedUuid: string = already["courses_uuid"];
            if (targetDept === schedDept && targetUuid === schedUuid) {
                return false;
            }
        }
        return true;
    }

    public checkRoomSize(section: any, seats: number): boolean | string {
        let sumSize = section["courses_pass"] + section["courses_fail"] + section["courses_audit"];
        return sumSize <= seats;
    }

    public checkroomAvailable(timeTable: Map<string, boolean>): any {
        for (let k of timeTable.keys()) {
            if (timeTable.get(k)) {
                timeTable.set(k, false);
                return k;
            }
        }
        return false;
    }

    public getLargestSec(courses: any[], seats: number): any {
        for (let singleSec of courses) {
            if (this.checkRoomSize(singleSec, seats)) {
                return singleSec;
            }
        }
        return false;
    }

    public setSchedule(timeTable: Map<string, boolean>) {
        timeTable.set("MWF 0800-0900", true);
        timeTable.set("MWF 0900-1000", true);
        timeTable.set("MWF 1000-1100", true);
        timeTable.set("MWF 1100-1200", true);
        timeTable.set("MWF 1200-1300", true);
        timeTable.set("MWF 1300-1400", true);
        timeTable.set("MWF 1400-1500", true);
        timeTable.set("MWF 1500-1600", true);
        timeTable.set("MWF 1600-1700", true);
        timeTable.set("TR  0800-0930", true);
        timeTable.set("TR  0930-1100", true);
        timeTable.set("TR  1100-1230", true);
        timeTable.set("TR  1230-1400", true);
        timeTable.set("TR  1400-1530", true);
        timeTable.set("TR  1530-1700", true);
    }
}
