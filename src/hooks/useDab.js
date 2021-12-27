/* global BigInt */
import { Principal } from "@dfinity/principal";
import { getAllUserNFTs } from "@psychedelic/dab-js";
import React from "react";
import { useSelector } from "react-redux";
import { toHexString } from "../ic/utils";

export const useDab = () => {
  const currentPrincipal = useSelector((state) => state.currentPrincipal);
  const principal = useSelector(
    (state) => state.principals[currentPrincipal].identity.principal,
  );

  const [dabCollections, setDabCollections] = React.useState([]);
  const [dabNfts, setDabNfts] = React.useState([]);

  React.useEffect(() => {
    const getNFTCollections = async () => {
      const res = await getNftDabCollections(principal).catch((err) => {
        console.error(err);
      });
      if (!res) return;
      const { dabCollections, dabNfts } = res;

      setDabCollections(dabCollections);
      setDabNfts(dabNfts);
    };
    getNFTCollections();
  }, [dabNfts, principal]);

  return {
    dabCollections,
    dabNfts,
  };
};

const transformDabToStoicCollection = (dabCollection) => {
  return dabCollection.map((collection) => ({
    isDabCollection: true,
    canister: collection.canisterId,
    name: collection.name,
    market: false,
    mature: false,
    nftv: false,
    nfts: collection.tokens.map((nft) => // this prop is not required in stoic collections but added for convenience
      transformDabToStoicNFT(nft, collection.icon),
    ),
    standard: collection.standard,
    // comaddress ?
    // commission ?
    // route ?
  }));
};

const transformDabToStoicNFT = (dabToken, icon) => {
  const index = Number(BigInt(dabToken.index).toString());
  return {
    isDabToken: true,
    allowedToList: false,
    canister: dabToken.canister,
    id: dabToken.id,
    url: dabToken.url,
    index,
    listing: false,
    metadata: Array.isArray(dabToken.metadata) ? toHexString(dabToken.metadata) : "", // TODO defaulting to dummy string until we agree on a metadata format
    icon,
    standard: dabToken.standard,
    collection: dabToken.collection,
  };
};

export const getNftDabCollections = async (principal) => {
  const res = await getAllUserNFTs({
    user: Principal.fromText(principal),
  }).catch((e) => {
    console.warn("Error getting NFT collections from DAB", e);
  });
  if (!res) return;

  const dabCollections = transformDabToStoicCollection(res);

  const dabNfts = res.flatMap((col) =>
    col.tokens.map((nft) => transformDabToStoicNFT(nft, col.icon)),
  );
  return {
    dabCollections,
    dabNfts,
  };
};

/*
 * providing two lists it returns a new list that contains only
 * items that are not in the old list
 */
export const getExtraCollectionIds = (oldList, newList) => {
  const filtered = newList.filter((c) => oldList.indexOf(c) < 0);
  return filtered;
};

/*
 * providing two lists it returns a new list that contains only
 * items that are not in the old list
 */
export const getExtraCollections = (oldList, newList) => {
  const filtered = newList.filter((c) => {
    return !oldList.some((n) => n.canister === c.canister);
  });
  return filtered;
};

/*
 * providing two lists it returns a new list that contains only
 * items that are not in the old list
 */
export const getExtraNFTS = (oldList, newList) => {
  const filtered = newList.filter((a) => {
    return !oldList.some((b) => {
      return (
        // nft could have a an index or an id
        a.canister === b.canister && (a.id === b.id)
      );
    });
  });
  return filtered;
};

/*
 * providing one compined list it returns a new list that contains only the intersection
 * which means it remove any duplcaite items
 */
export const getNftsListIntersection = (array) => {
  const u = array.reduce((accumulator, current) => {
    if (
      !accumulator.some((x) => {
        if (
          x.canister === current.canister && x.id === current.id
        ) {
          return true;
        }
        return false;
      })
    ) {
      accumulator.push(current);
    }
    return accumulator;
  }, []);
  return u;
};
