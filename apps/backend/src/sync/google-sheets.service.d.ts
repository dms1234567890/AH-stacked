export declare class GoogleSheetsService {
    private readonly logger;
    private sheets;
    private initialized;
    constructor();
    private initializeClient;
    /**
     * Sync an entity's data to the appropriate Google Sheet.
     * Uses append mode for INSERT, update-in-place for UPDATE, and clear for DELETE.
     */
    sync(entityType: string, entityId: string, action: 'INSERT' | 'UPDATE' | 'DELETE', data: Record<string, any>): Promise<void>;
    /**
     * Append a new row to the sheet. If the sheet has no header row,
     * it writes the column headers first based on the data keys.
     */
    private appendRow;
    /**
     * Update a row identified by entityId. We find the row by scanning
     * the first column for a matching ID. This is O(n) but fine for moderate sheets.
     */
    private updateRow;
    /**
     * Delete a row by clearing its content. Sheets API does not support
     * row deletion directly via values, so we clear and shift if needed.
     * We use the batchUpdate method to delete rows when possible.
     */
    private deleteRow;
    /**
     * Read the header row (first row) of a sheet.
     */
    private getHeaders;
    /**
     * Read all data rows (excluding header) from a sheet.
     */
    private getAllRows;
}
//# sourceMappingURL=google-sheets.service.d.ts.map