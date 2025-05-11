type ScheduleEvent = {
    title: string;
    startDate: string;
    note: string | null;
    color: string;
};

type Schedule = {
    [month: string]: ScheduleEvent[];
};
