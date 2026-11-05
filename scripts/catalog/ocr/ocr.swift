// Local OCR with macOS Vision (no network). Usage: ocr <image>... → one JSON line per image: {"file": "...", "text": "..."}
import Foundation
import Vision
import AppKit

for path in CommandLine.arguments.dropFirst() {
    var text = ""
    if let image = NSImage(contentsOfFile: path), let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) {
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = false
        try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([request])
        text = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }.joined(separator: " ")
    }
    let obj: [String: String] = ["file": path, "text": text]
    if let data = try? JSONSerialization.data(withJSONObject: obj), let line = String(data: data, encoding: .utf8) {
        print(line)
        fflush(stdout)
    }
}
