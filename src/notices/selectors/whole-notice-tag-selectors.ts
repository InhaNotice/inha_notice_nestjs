export abstract class GeneralTagSelectors {
    static readonly NOTICE_BOARD: string = '.artclTable tr:not(.headline)';
    static readonly NOTICE_TITLE: string = '._artclTdTitle .artclLinkView';
    static readonly NOTICE_DATE: string = '._artclTdRdate';
    static readonly NOTICE_WRITER: string = '._artclTdWriter';
    static readonly NOTICE_ACCESS: string = '._artclTdAccess';
}