-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TandaTanganElektronik" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "logoTandaTangan" TEXT,
    "alamat" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TandaTanganElektronik" ("alamat", "id", "logoTandaTangan", "nama", "updatedAt") SELECT "alamat", "id", "logoTandaTangan", "nama", "updatedAt" FROM "TandaTanganElektronik";
DROP TABLE "TandaTanganElektronik";
ALTER TABLE "new_TandaTanganElektronik" RENAME TO "TandaTanganElektronik";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
