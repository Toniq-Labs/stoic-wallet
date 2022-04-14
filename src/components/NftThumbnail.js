import React from "react";

import { compressAddress } from "../utils.js";

let imageContentType = ["image/jpeg", "image/png", "image/gif", "image/svg+xml"];

export default function NftThumbnail({ nft }) {
  const [contentType, setContentType] = React.useState("");

  React.useEffect(() => {
    let getContentTypeAsync = async () => {
      let contentType = await getContentType(getNftLink(nft));
      setContentType(contentType);
    };
    getContentTypeAsync();
  }, [nft]);

  if (contentType === "video/mp4") {
    return (
      <a href={getNftLink(nft)} target="_blank" rel="noreferrer">
        <video
          src={getNftImg(nft)}
          autoPlay
          loop
          preload
          muted
          playsInline
          style={{ width: "64px" }}
        >
          {compressAddress(nft.id)}
        </video>
      </a>
    );
  } else if (imageContentType.includes(contentType)) {
    return (
      <a href={getNftLink(nft)} target="_blank" rel="noreferrer">
        <img
          id={"img-" + nft.id}
          alt={compressAddress(nft.id)}
          src={getNftImg(nft)}
          style={{ width: 64 }}
        />
      </a>
    );
  } else {
    return (
      <a
        href={getNftLink(nft)}
        target="_blank"
        rel="noreferrer"
        style={{ display: "block" }}
      >
        <object
          data={getNftImg(nft)}
          id={"img-" + nft.id}
          width="64"
          style={{ pointerEvents: "none" }}
        >
          {compressAddress(nft.id)}
        </object>
      </a>
    );
  }
}

const getContentType = async (url) => {
  let response = await fetch(url);
  let contentType = response.headers.get("Content-Type");
  return contentType;
};

const getNftLink = (nft) => {
  if (nft.isDabToken) return nft.url;
  if (nft.canister === "qcg3w-tyaaa-aaaah-qakea-cai")
    return "https://" + nft.canister + ".raw.ic0.app/Token/" + nft.index;
  else if (nft.canister === "jzg5e-giaaa-aaaah-qaqda-cai")
    return "https://qcg3w-tyaaa-aaaah-qakea-cai.raw.ic0.app/Token/" + nft.index;
  else if (nft.canister === "bxdf4-baaaa-aaaah-qaruq-cai")
    return "https://qcg3w-tyaaa-aaaah-qakea-cai.raw.ic0.app/Token/" + nft.index;
  else if (nft.canister === "d3ttm-qaaaa-aaaai-qam4a-cai")
    return (
      "https://d3ttm-qaaaa-aaaai-qam4a-cai.raw.ic0.app/?tokenId=" + nft.index
    );
  else if (nft.canister === "3db6u-aiaaa-aaaah-qbjbq-cai")
    return (
      "https://d3ttm-qaaaa-aaaai-qam4a-cai.raw.ic0.app/?tokenId=" + nft.index
    );
  else if (nft.canister === "xkbqi-2qaaa-aaaah-qbpqq-cai")
    return icpbunnyimg(nft.index);
  else if (nft.canister === "q6hjz-kyaaa-aaaah-qcama-cai")
    return icpbunnyimg(nft.index);
  else return "https://" + nft.canister + ".raw.ic0.app/?tokenid=" + nft.id;
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

  return "https://" + icbstorage[i % 10] + ".raw.ic0.app/Token/" + i;
};

const getNftImg = (nft) => {
  if (nft.isDabToken) return nft.url;
  if (nft.canister === "qcg3w-tyaaa-aaaah-qakea-cai")
    return "https://" + nft.canister + ".raw.ic0.app/Token/" + nft.index;
  else if (nft.canister === "jzg5e-giaaa-aaaah-qaqda-cai")
    return "https://qcg3w-tyaaa-aaaah-qakea-cai.raw.ic0.app/Token/" + nft.index;
  else if (nft.canister === "bxdf4-baaaa-aaaah-qaruq-cai")
    return "https://qcg3w-tyaaa-aaaah-qakea-cai.raw.ic0.app/Token/" + nft.index;
  else if (nft.canister === "d3ttm-qaaaa-aaaai-qam4a-cai")
    return (
      "https://d3ttm-qaaaa-aaaai-qam4a-cai.raw.ic0.app/?tokenId=" + nft.index
    );
  else if (nft.canister === "3db6u-aiaaa-aaaah-qbjbq-cai")
    return (
      "https://d3ttm-qaaaa-aaaai-qam4a-cai.raw.ic0.app/?tokenId=" + nft.index
    );
  else if (nft.canister === "xkbqi-2qaaa-aaaah-qbpqq-cai")
    return icpbunnyimg(nft.index);
  else if (nft.canister === "q6hjz-kyaaa-aaaah-qcama-cai")
    return icpbunnyimg(nft.index);
  else
    return (
      "https://" +
      nft.canister +
      ".raw.ic0.app/?type=thumbnail&tokenid=" +
      nft.id
    );
};
