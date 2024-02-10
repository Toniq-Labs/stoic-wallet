import React from "react";

import { compressAddress } from "../utils.js";

export default function NftThumbnail({ nft }) {
  let link = getNftLink(nft);
  let img = getNftImg(nft);
  if (link) {
    return (<a href={link} target="_blank" rel="noreferrer" style={{ display: "block" }} >
        {img ? (<img id={"img-"+nft.tokenid} alt={compressAddress(nft.tokenid)} src={img} style={{width:64}} />) : (<p>No preview available</p>)}
      </a>
    );
  } else {
    if (img) {
      return (<img id={"img-"+nft.tokenid} alt={compressAddress(nft.tokenid)} src={img} style={{width:64}} />);
    } else {
      return (<p>No preview available</p>);
    }
  }
}

const getNftLink = (nft) => {
  if (nft.canister === "qcg3w-tyaaa-aaaah-qakea-cai")
    return "https://" + nft.canister + ".raw.icp0.io/Token/" + nft.tokenindex;
  else if (nft.canister === "jzg5e-giaaa-aaaah-qaqda-cai")
    return "https://qcg3w-tyaaa-aaaah-qakea-cai.raw.icp0.io/Token/" + nft.tokenindex;
  else if (nft.canister === "bxdf4-baaaa-aaaah-qaruq-cai")
    return "https://qcg3w-tyaaa-aaaah-qakea-cai.raw.icp0.io/Token/" + nft.tokenindex;
  else if (nft.canister === "d3ttm-qaaaa-aaaai-qam4a-cai")
    return (
      "https://d3ttm-qaaaa-aaaai-qam4a-cai.raw.icp0.io/?tokenId=" + nft.tokenindex
    );
  else if (nft.canister === "3db6u-aiaaa-aaaah-qbjbq-cai")
    return (
      "https://d3ttm-qaaaa-aaaai-qam4a-cai.raw.icp0.io/?tokenId=" + nft.tokenindex
    );
  else if (nft.canister === "xkbqi-2qaaa-aaaah-qbpqq-cai")
    return icpbunnyimg(nft.tokenindex);
  else if (nft.canister === "q6hjz-kyaaa-aaaah-qcama-cai")
    return icpbunnyimg(nft.tokenindex);
  else if (nft.standard === "EXT")
    return "https://" + nft.canister + ".raw.icp0.io/?tokenid=" + nft.tokenid;
  else return false;
};

const icpbunnyimg = (i) => {
  const icbstorage = [
    "efqhu-yqaaa-aaaaf-qaeda-cai",
    "ecrba-viaaa-aaaaf-qaedq-cai",
    "fp7fo-2aaaa-aaaaf-qaeea-cai",
    "fi6d2-xyaaa-aaaaf-qaeeq-cai",
    "fb5ig-bqaaa-aaaaf-qaefa-cai",
    "fg4os-miaaa-aaaaf-qaefq-cai",
    "ft377-naaaa-aaaaf-qaega-cai",
    "fu2zl-ayaaa-aaaaf-qaegq-cai",
    "f5zsx-wqaaa-aaaaf-qaeha-cai",
    "f2yud-3iaaa-aaaaf-qaehq-cai",
  ];

  return "https://" + icbstorage[i % 10] + ".raw.icp0.io/Token/" + i;
};

const getNftImg = (nft) => {
  
  if (nft.canister === "qcg3w-tyaaa-aaaah-qakea-cai")
    return "https://" + nft.canister + ".raw.icp0.io/Token/" + nft.tokenindex;
  else if (nft.canister === "jzg5e-giaaa-aaaah-qaqda-cai")
    return "https://qcg3w-tyaaa-aaaah-qakea-cai.raw.icp0.io/Token/" + nft.tokenindex;
  else if (nft.canister === "bxdf4-baaaa-aaaah-qaruq-cai")
    return "https://qcg3w-tyaaa-aaaah-qakea-cai.raw.icp0.io/Token/" + nft.tokenindex;
  else if (nft.canister === "d3ttm-qaaaa-aaaai-qam4a-cai")
    return (
      "https://d3ttm-qaaaa-aaaai-qam4a-cai.raw.icp0.io/?tokenId=" + nft.tokenindex
    );
  else if (nft.canister === "3db6u-aiaaa-aaaah-qbjbq-cai")
    return (
      "https://d3ttm-qaaaa-aaaai-qam4a-cai.raw.icp0.io/?tokenId=" + nft.tokenindex
    );
  else if (nft.canister === "xkbqi-2qaaa-aaaah-qbpqq-cai")
    return icpbunnyimg(nft.tokenindex);
  else if (nft.canister === "q6hjz-kyaaa-aaaah-qcama-cai")
    return icpbunnyimg(nft.tokenindex);
  else if (nft.standard === "EXT")
    return (
      "https://" +
      nft.canister +
      ".raw.icp0.io/?type=thumbnail&tokenid=" +
      nft.tokenid
    );
  else return false;
};
