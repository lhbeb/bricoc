import React from 'react';
import { MapPin, Truck, RefreshCw } from 'lucide-react';
import { getMarket, getDeliveryRange } from '@/lib/markets';

interface ShippingInfoProps {
  className?: string;
  targetMarket?: string | null;
}

const ShippingInfo: React.FC<ShippingInfoProps> = ({ className = '', targetMarket }) => {
  const market = getMarket(targetMarket);
  const deliveryRange = getDeliveryRange(market);

  return (
    <div className={`overflow-hidden rounded-[24px] border border-[#233F31]/15 bg-white ${className}`}>
      <div className="grid grid-cols-1 divide-y divide-[#233F31]/10 md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#FAF6EB] text-[#233F31]">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500">Ships from</p>
              <p className="mt-1 text-sm font-semibold text-[#233F31]">
                {market.shipsFrom} {market.shipsFromFlag}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#FAF6EB] text-[#233F31]">
              <Truck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500">Estimated delivery</p>
              <p className="mt-1 text-sm font-semibold text-[#233F31]">Get it by {deliveryRange}</p>
              <p className="mt-1 text-sm text-[#789676] font-medium">{market.freeShippingText}</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#FAF6EB] text-[#233F31]">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500">Returns</p>
              <p className="mt-1 text-sm font-semibold text-[#233F31]">{market.returnsText}</p>
              <p className="mt-1 text-sm text-[#789676] font-medium">Hassle-free 30-day guarantee</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingInfo;
