"use client";

import Image from "next/image";
import { Truck, Package, CheckCheck, TShirt, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RedemptionHistory {
  id: string;
  itemName: string;
  itemType: "digital" | "physical";
  redemptionDate: string;
  pointsCost: number;
  status: "delivered" | "shipped" | "processing" | "claimed";
  trackingInfo?: string;
  estimatedDelivery?: string;
  image?: string;
}

const SwagHistory = () => {
  const redemptionHistory: RedemptionHistory[] = [
    {
      id: "r1",
      itemName: "Gold Contributor Badge",
      itemType: "digital",
      redemptionDate: "Mar 15, 2025",
      pointsCost: 300,
      status: "claimed",
    },
    {
      id: "r2",
      itemName: "Premium Profile Background",
      itemType: "digital",
      redemptionDate: "Feb 28, 2025",
      pointsCost: 450,
      status: "claimed",
    },
    {
      id: "r3",
      itemName: "Branded Notebook & Pen Set",
      itemType: "physical",
      redemptionDate: "Feb 10, 2025",
      pointsCost: 1200,
      status: "delivered",
      trackingInfo: "USPS1234567890",
    },
    {
      id: "r4",
      itemName: "Growth Mindset Water Bottle",
      itemType: "physical",
      redemptionDate: "Jan 22, 2025",
      pointsCost: 900,
      status: "shipped",
      trackingInfo: "FDX9876543210",
      estimatedDelivery: "Mar 28, 2025",
    },
  ];

  const totalPointsSpent = redemptionHistory.reduce(
    (sum, item) => sum + item.pointsCost,
    0
  );

  const getStatusBadge = (status: RedemptionHistory["status"]) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-green-500">Delivered</Badge>;
      case "shipped":
        return <Badge className="bg-blue-500">Shipped</Badge>;
      case "processing":
        return <Badge className="bg-amber-500">Processing</Badge>;
      case "claimed":
        return <Badge className="bg-purple-500">Claimed</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: RedemptionHistory["status"], type: RedemptionHistory["itemType"]) => {
    if (type === "digital") {
      return <Award className="h-5 w-5 text-purple-500" />;
    }

    switch (status) {
      case "delivered":
        return <CheckCheck className="h-5 w-5 text-green-500" />;
      case "shipped":
        return <Truck className="h-5 w-5 text-blue-500" />;
      case "processing":
        return <Package className="h-5 w-5 text-amber-500" />;
      default:
        return <TShirt className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full">
      <div className="p-5 border-b border-gray-200">
        <h3 className="font-semibold text-lg">Redemption History</h3>
      </div>

      <div className="p-5">
        <div className="text-center mb-5">
          <div className="text-sm text-gray-600">Total Points Spent</div>
          <div className="text-2xl font-bold text-amber-600">{totalPointsSpent}</div>
        </div>

        <div className="space-y-4">
          {redemptionHistory.length > 0 ? (
            redemptionHistory.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start">
                  <div className="mr-3">
                    {getStatusIcon(item.status, item.itemType)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">{item.itemName}</h4>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-gray-500 mr-2">
                            {item.redemptionDate}
                          </span>
                          <span className="text-xs text-blue-600">
                            {item.pointsCost} pts
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>

                    {item.status === "shipped" && item.estimatedDelivery && (
                      <div className="mt-2 text-xs text-gray-600">
                        Estimated delivery: {item.estimatedDelivery}
                      </div>
                    )}

                    {(item.status === "shipped" || item.status === "delivered") && item.trackingInfo && (
                      <div className="mt-2">
                        <Button variant="link" className="text-xs h-auto p-0">
                          Track Package ({item.trackingInfo})
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">You haven't redeemed any rewards yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 p-4 bg-gray-50 text-center">
        <Button variant="link" className="text-sm text-blue-600">
          View full history
        </Button>
      </div>
    </div>
  );
};

export default SwagHistory;
