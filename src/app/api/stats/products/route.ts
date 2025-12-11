import { dbConnect } from "@/lib/mongodb";
import Commentaire from "@/models/Commentaire";
import Produit from "@/models/Produit"; // Register Produit model
import User from "@/models/User"; // Register User model
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    jwt.verify(token, process.env.JWT_SECRET as string);

    await dbConnect();

    const stats = await Commentaire.aggregate([
      {
        $group: {
          _id: "$produit",
          total: { $sum: 1 },
          positifs: {
            $sum: { $cond: [{ $eq: ["$sentiment", "positif"] }, 1, 0] },
          },
          negatifs: {
            $sum: { $cond: [{ $eq: ["$sentiment", "negatif"] }, 1, 0] },
          },
          neutres: {
            $sum: { $cond: [{ $eq: ["$sentiment", "neutre"] }, 1, 0] },
          },
          noteMoyenne: { $avg: "$note" },
        },
      },
      {
        $lookup: {
          from: "produits",
          localField: "_id",
          foreignField: "_id",
          as: "produit",
        },
      },
      { $unwind: "$produit" },
      {
        $project: {
          _id: 0,
          produitId: "$_id",
          nom: "$produit.nom",
          image: "$produit.image",
          total: 1,
          positifs: 1,
          negatifs: 1,
          neutres: 1,
          noteMoyenne: 1,
          positifPercent: {
            $cond: [
              { $gt: [{ $add: ["$positifs", "$negatifs", "$neutres"] }, 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      "$positifs",
                      { $add: ["$positifs", "$negatifs", "$neutres"] },
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
          neutrePercent: {
            $cond: [
              { $gt: [{ $add: ["$positifs", "$negatifs", "$neutres"] }, 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      "$neutres",
                      { $add: ["$positifs", "$negatifs", "$neutres"] },
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
          negatifPercent: {
            $cond: [
              { $gt: [{ $add: ["$positifs", "$negatifs", "$neutres"] }, 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      "$negatifs",
                      { $add: ["$positifs", "$negatifs", "$neutres"] },
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
          scoreGlobal: {
            $cond: [
              { $gt: ["$total", 0] },
              {
                $divide: [{ $subtract: ["$positifs", "$negatifs"] }, "$total"],
              },
              0,
            ],
          },
        },
      },
      {
        $sort: { scoreGlobal: -1, total: -1 },
      },
    ]);

    return new Response(JSON.stringify(stats), { status: 200 });
  } catch (error) {
    console.error("Error fetching product sentiment stats:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}



