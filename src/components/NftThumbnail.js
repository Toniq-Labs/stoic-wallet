import React from "react";

import { compressAddress } from "../utils.js";

// Storage canisters for ICP Bunny images (round-robined by token index).
const ICB_STORAGE = [
  "efqhu-yqaaa-aaaaf-qaeda-cai", "ecrba-viaaa-aaaaf-qaedq-cai",
  "fp7fo-2aaaa-aaaaf-qaeea-cai", "fi6d2-xyaaa-aaaaf-qaeeq-cai",
  "fb5ig-bqaaa-aaaaf-qaefa-cai", "fg4os-miaaa-aaaaf-qaefq-cai",
  "ft377-naaaa-aaaaf-qaega-cai", "fu2zl-ayaaa-aaaaf-qaegq-cai",
  "f5zsx-wqaaa-aaaaf-qaeha-cai", "f2yud-3iaaa-aaaaf-qaehq-cai",
];
const icpbunnyimg = (i) => "https://" + ICB_STORAGE[i % 10] + ".raw.icp0.io/Token/" + i;

// Resolve the canonical URL for an NFT's preview image or its detail link.
// `kind` only matters for the generic EXT fallback (the image uses a thumbnail
// query); every special-cased canister returns the same URL for both.
const resolveNftUrl = (nft, kind) => {
  switch (nft.canister) {
    case "qcg3w-tyaaa-aaaah-qakea-cai":
      return "https://" + nft.canister + ".raw.icp0.io/Token/" + nft.tokenindex;
    case "jzg5e-giaaa-aaaah-qaqda-cai":
    case "bxdf4-baaaa-aaaah-qaruq-cai":
      return "https://qcg3w-tyaaa-aaaah-qakea-cai.raw.icp0.io/Token/" + nft.tokenindex;
    case "d3ttm-qaaaa-aaaai-qam4a-cai":
    case "3db6u-aiaaa-aaaah-qbjbq-cai":
      return "https://d3ttm-qaaaa-aaaai-qam4a-cai.raw.icp0.io/?tokenId=" + nft.tokenindex;
    case "xkbqi-2qaaa-aaaah-qbpqq-cai":
    case "q6hjz-kyaaa-aaaah-qcama-cai":
      return icpbunnyimg(nft.tokenindex);
    default:
      if (nft.standard === "EXT") {
        return kind === "img"
          ? "https://" + nft.canister + ".raw.icp0.io/?type=thumbnail&tokenid=" + nft.tokenid
          : "https://" + nft.canister + ".raw.icp0.io/?tokenid=" + nft.tokenid;
      }
      return false;
  }
};
const getNftLink = (nft) => resolveNftUrl(nft, "link");
const getNftImg = (nft) => resolveNftUrl(nft, "img");

function NftThumbnail({ nft }) {
  const link = getNftLink(nft);
  const img = getNftImg(nft);
  const image = img ? (
    <img id={"img-" + nft.tokenid} alt={compressAddress(nft.tokenid)} src={img}
         loading="lazy" decoding="async" referrerPolicy="no-referrer" style={{ width: 64 }} />
  ) : (
    <p>No preview available</p>
  );
  if (link) {
    return (
      <a href={link} target="_blank" rel="noreferrer" style={{ display: "block" }}>
        {image}
      </a>
    );
  }
  return image;
}

export default React.memo(NftThumbnail);
