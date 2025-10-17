'use client';

import { Button } from '@/components/ui/Button';
import { Gift, UserPlus } from 'lucide-react';
import Link from 'next/link';

const SteamSupportUnit = () => {
  const steamProfileLink = "https://steamcommunity.com/id/khrotu/";
  const steamGiftCardLink = "https://store.steampowered.com/digitalgiftcards/selectgiftcard";

  return (
    <div className="mt-2 mb-4 pt-4 border-t border-neutral-dark/30 text-center">
      <p className="text-xs text-text/70 mb-3">
        Liking the tool? Help support future updates with a Steam gift card!
      </p>
      <p className="text-[10px] text-text/60 mb-3 px-2 py-1.5 bg-neutral rounded-md leading-snug">
        Heads up: Steam requires users to be friends for at least 3 days before sending a digital gift card.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Link 
            href={steamProfileLink} 
            target="_blank" 
            rel="noopener noreferrer nofollow" 
        >
          <Button variant="outline" className="w-full sm:w-auto h-9 text-xs">
            <UserPlus className="mr-2 h-3 w-3" />
            1. Add on Steam
          </Button>
        </Link>
        <Link 
            href={steamGiftCardLink} 
            target="_blank" 
            rel="noopener noreferrer" 
        >
          <Button variant="outline" className="w-full sm:w-auto h-9 text-xs">
            <Gift className="mr-2 h-3 w-3" />
            2. Send Gift Card
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default SteamSupportUnit;