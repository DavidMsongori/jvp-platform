import {
  Printer,
  Download,
  Share2,
  RefreshCw,
} from "lucide-react";

const CardActions = ({
  onPrint,
  onDownload,
  onShare,
  onRefresh,
  loading = false,
}) => {
  return (
    <div className="card-actions">

      <button
        type="button"
        className="card-action-btn primary"
        onClick={onPrint}
        disabled={loading}
      >
        <Printer size={18} />
        <span>Print Card</span>
      </button>

      <button
        type="button"
        className="card-action-btn"
        onClick={onDownload}
        disabled={loading}
      >
        <Download size={18} />
        <span>Download</span>
      </button>

      <button
        type="button"
        className="card-action-btn"
        onClick={onShare}
        disabled={loading}
      >
        <Share2 size={18} />
        <span>Share</span>
      </button>

      <button
        type="button"
        className="card-action-btn"
        onClick={onRefresh}
        disabled={loading}
      >
        <RefreshCw
          size={18}
          className={loading ? "spin" : ""}
        />

        <span>
          {loading ? "Refreshing..." : "Refresh"}
        </span>
      </button>

    </div>
  );
};

export default CardActions;