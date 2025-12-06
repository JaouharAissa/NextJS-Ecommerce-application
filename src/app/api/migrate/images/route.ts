// app/api/migrate/images/route.ts
import { dbConnect } from "@/lib/mongodb";
import Produit from "@/models/Produit";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await dbConnect();

        // Find all products that have 'image' field but no 'images' field
        // Note: Since we updated the schema, we might need to use strict: false or lean() to see the old field
        // But Mongoose models usually strip unknown fields.
        // However, we can use updateMany with aggregation pipeline to migrate data at DB level

        const result = await Produit.collection.updateMany(
            {
                image: { $exists: true },
                images: { $exists: false }
            },
            [
                {
                    $set: {
                        images: ["$image"]
                    }
                },
                {
                    $unset: "image"
                }
            ]
        );

        return NextResponse.json({
            message: "Migration completed",
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount
        });
    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json({ error: "Migration failed" }, { status: 500 });
    }
}
