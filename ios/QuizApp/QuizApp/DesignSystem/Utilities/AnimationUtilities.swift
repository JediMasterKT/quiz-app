import SwiftUI

// MARK: - Animation Presets
public struct AnimationPresets {
    // MARK: - Page Transitions
    public static let pageTransition = AnyTransition.asymmetric(
        insertion: .move(edge: .trailing).combined(with: .opacity),
        removal: .move(edge: .leading).combined(with: .opacity)
    )
    
    public static let sheetTransition = AnyTransition.asymmetric(
        insertion: .move(edge: .bottom).combined(with: .opacity),
        removal: .move(edge: .bottom).combined(with: .opacity)
    )
    
    public static let fadeTransition = AnyTransition.opacity
        .animation(AnimationTokens.Spring.smooth)
    
    public static let scaleTransition = AnyTransition.scale(scale: 0.8)
        .combined(with: .opacity)
        .animation(AnimationTokens.Spring.bouncy)
    
    // MARK: - List Item Transitions
    public static let listItemInsert = AnyTransition.asymmetric(
        insertion: .move(edge: .trailing).combined(with: .opacity),
        removal: .scale(scale: 0.8).combined(with: .opacity)
    )
    
    // MARK: - Card Transitions
    public static let cardFlip = AnyTransition.asymmetric(
        insertion: .opacity.combined(with: .rotation3DEffect(
            .degrees(90),
            axis: (x: 0, y: 1, z: 0),
            anchor: .leading,
            perspective: 0.5
        )),
        removal: .opacity.combined(with: .rotation3DEffect(
            .degrees(-90),
            axis: (x: 0, y: 1, z: 0),
            anchor: .trailing,
            perspective: 0.5
        ))
    )
}

// MARK: - 60fps Animation Wrapper
public struct SmoothAnimation<Content: View>: View {
    let animation: Animation
    let value: AnyHashable
    let content: () -> Content
    
    public init(
        _ animation: Animation = AnimationTokens.Spring.smooth,
        value: AnyHashable,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.animation = animation
        self.value = value
        self.content = content
    }
    
    public var body: some View {
        content()
            .animation(animation, value: value)
            .drawingGroup() // Forces GPU rendering for 60fps
    }
}

// MARK: - Shake Animation
public struct ShakeEffect: GeometryEffect {
    var amount: CGFloat = 10
    var shakesPerUnit = 3
    var animatableData: CGFloat
    
    public init(animatableData: CGFloat) {
        self.animatableData = animatableData
    }
    
    public func effectValue(size: CGSize) -> ProjectionTransform {
        ProjectionTransform(CGAffineTransform(
            translationX: amount * sin(animatableData * .pi * CGFloat(shakesPerUnit)),
            y: 0
        ))
    }
}

extension View {
    public func shake(times: Int) -> some View {
        self.modifier(ShakeModifier(shakes: times))
    }
}

struct ShakeModifier: ViewModifier {
    @State private var shakes: CGFloat = 0
    let originalShakes: Int
    
    init(shakes: Int) {
        self.originalShakes = shakes
    }
    
    func body(content: Content) -> some View {
        content
            .modifier(ShakeEffect(animatableData: shakes))
            .onAppear {
                withAnimation(AnimationTokens.Spring.snappy) {
                    shakes = CGFloat(originalShakes)
                }
            }
    }
}

// MARK: - Pulse Animation
public struct PulseAnimation: ViewModifier {
    @State private var isPulsing = false
    let duration: Double
    let scale: CGFloat
    
    public init(duration: Double = 1.5, scale: CGFloat = 1.1) {
        self.duration = duration
        self.scale = scale
    }
    
    public func body(content: Content) -> some View {
        content
            .scaleEffect(isPulsing ? scale : 1.0)
            .opacity(isPulsing ? 0.8 : 1.0)
            .animation(
                Animation.easeInOut(duration: duration)
                    .repeatForever(autoreverses: true),
                value: isPulsing
            )
            .onAppear {
                isPulsing = true
            }
    }
}

extension View {
    public func pulse(duration: Double = 1.5, scale: CGFloat = 1.1) -> some View {
        self.modifier(PulseAnimation(duration: duration, scale: scale))
    }
}

// MARK: - Bounce Animation
public struct BounceAnimation: ViewModifier {
    @State private var isBouncing = false
    let height: CGFloat
    let duration: Double
    
    public init(height: CGFloat = 20, duration: Double = 0.5) {
        self.height = height
        self.duration = duration
    }
    
    public func body(content: Content) -> some View {
        content
            .offset(y: isBouncing ? -height : 0)
            .animation(
                Animation.interpolatingSpring(
                    stiffness: 200,
                    damping: 10
                )
                .repeatForever(autoreverses: true),
                value: isBouncing
            )
            .onAppear {
                isBouncing = true
            }
    }
}

extension View {
    public func bounce(height: CGFloat = 20, duration: Double = 0.5) -> some View {
        self.modifier(BounceAnimation(height: height, duration: duration))
    }
}

// MARK: - Flip Animation
public struct FlipAnimation: ViewModifier {
    @State private var flipped = false
    @State private var angle: Double = 0
    
    let axis: (x: CGFloat, y: CGFloat, z: CGFloat)
    let perspective: CGFloat
    let onFlip: (() -> Void)?
    
    public init(
        axis: (x: CGFloat, y: CGFloat, z: CGFloat) = (x: 0, y: 1, z: 0),
        perspective: CGFloat = 0.5,
        onFlip: (() -> Void)? = nil
    ) {
        self.axis = axis
        self.perspective = perspective
        self.onFlip = onFlip
    }
    
    public func body(content: Content) -> some View {
        content
            .rotation3DEffect(
                .degrees(angle),
                axis: axis,
                perspective: perspective
            )
            .onTapGesture {
                withAnimation(AnimationTokens.Spring.bouncy) {
                    angle += 180
                    flipped.toggle()
                }
                onFlip?()
            }
    }
}

extension View {
    public func flipOnTap(
        axis: (x: CGFloat, y: CGFloat, z: CGFloat) = (x: 0, y: 1, z: 0),
        perspective: CGFloat = 0.5,
        onFlip: (() -> Void)? = nil
    ) -> some View {
        self.modifier(FlipAnimation(axis: axis, perspective: perspective, onFlip: onFlip))
    }
}

// MARK: - Stagger Animation
public struct StaggeredAnimation<Content: View>: View {
    let items: [AnyHashable]
    let stagger: Double
    let animation: Animation
    let content: (Int) -> Content
    
    @State private var appeared = false
    
    public init(
        items: [AnyHashable],
        stagger: Double = 0.1,
        animation: Animation = AnimationTokens.Spring.smooth,
        @ViewBuilder content: @escaping (Int) -> Content
    ) {
        self.items = items
        self.stagger = stagger
        self.animation = animation
        self.content = content
    }
    
    public var body: some View {
        ForEach(0..<items.count, id: \.self) { index in
            content(index)
                .opacity(appeared ? 1 : 0)
                .offset(y: appeared ? 0 : 20)
                .animation(
                    animation.delay(Double(index) * stagger),
                    value: appeared
                )
        }
        .onAppear {
            appeared = true
        }
    }
}

// MARK: - Loading Animation
public struct LoadingDots: View {
    @State private var animating = false
    let color: Color
    let size: CGFloat
    
    public init(color: Color = ColorTokens.Brand.primary, size: CGFloat = 8) {
        self.color = color
        self.size = size
    }
    
    public var body: some View {
        HStack(spacing: size / 2) {
            ForEach(0..<3) { index in
                Circle()
                    .fill(color)
                    .frame(width: size, height: size)
                    .scaleEffect(animating ? 1 : 0.5)
                    .animation(
                        Animation.easeInOut(duration: 0.6)
                            .repeatForever()
                            .delay(0.2 * Double(index)),
                        value: animating
                    )
            }
        }
        .onAppear {
            animating = true
        }
    }
}

// MARK: - Success Animation
public struct SuccessCheckmark: View {
    @State private var isAnimating = false
    let size: CGFloat
    let color: Color
    
    public init(size: CGFloat = 60, color: Color = ColorTokens.Semantic.success) {
        self.size = size
        self.color = color
    }
    
    public var body: some View {
        ZStack {
            Circle()
                .stroke(color, lineWidth: size / 10)
                .frame(width: size, height: size)
                .scaleEffect(isAnimating ? 1 : 0)
                .opacity(isAnimating ? 1 : 0)
            
            Path { path in
                let width = size
                let height = size
                path.move(to: CGPoint(x: width * 0.25, y: height * 0.5))
                path.addLine(to: CGPoint(x: width * 0.4, y: height * 0.65))
                path.addLine(to: CGPoint(x: width * 0.75, y: height * 0.3))
            }
            .trim(from: 0, to: isAnimating ? 1 : 0)
            .stroke(color, style: StrokeStyle(lineWidth: size / 10, lineCap: .round, lineJoin: .round))
            .frame(width: size, height: size)
        }
        .onAppear {
            withAnimation(AnimationTokens.Spring.bouncy.delay(0.1)) {
                isAnimating = true
            }
        }
    }
}

// MARK: - Confetti Animation
public struct ConfettiView: View {
    @State private var confettiPieces: [ConfettiPiece] = []
    let count: Int
    let colors: [Color]
    
    public init(
        count: Int = 50,
        colors: [Color] = [
            ColorTokens.Brand.primary,
            ColorTokens.Semantic.success,
            ColorTokens.Semantic.warning,
            ColorTokens.Category.entertainment,
            ColorTokens.Category.sports
        ]
    ) {
        self.count = count
        self.colors = colors
    }
    
    public var body: some View {
        ZStack {
            ForEach(confettiPieces) { piece in
                Rectangle()
                    .fill(piece.color)
                    .frame(width: piece.size, height: piece.size * 2)
                    .rotationEffect(.degrees(piece.rotation))
                    .offset(x: piece.x, y: piece.y)
                    .opacity(piece.opacity)
                    .animation(
                        Animation.linear(duration: piece.duration)
                            .repeatForever(autoreverses: false),
                        value: piece.y
                    )
            }
        }
        .onAppear {
            createConfetti()
        }
    }
    
    private func createConfetti() {
        for _ in 0..<count {
            let piece = ConfettiPiece(
                color: colors.randomElement() ?? ColorTokens.Brand.primary,
                size: CGFloat.random(in: 4...8),
                x: CGFloat.random(in: -200...200),
                y: -400,
                rotation: Double.random(in: 0...360),
                duration: Double.random(in: 2...4),
                opacity: Double.random(in: 0.7...1)
            )
            confettiPieces.append(piece)
        }
        
        // Animate pieces falling
        withAnimation {
            for index in confettiPieces.indices {
                confettiPieces[index].y = 800
            }
        }
    }
}

struct ConfettiPiece: Identifiable {
    let id = UUID()
    let color: Color
    let size: CGFloat
    var x: CGFloat
    var y: CGFloat
    let rotation: Double
    let duration: Double
    let opacity: Double
}

// MARK: - Preview
struct AnimationUtilities_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: SpacingTokens.xl) {
            Text("Shake Me!")
                .shake(times: 3)
            
            Text("Pulse Animation")
                .pulse()
            
            Text("Bounce Animation")
                .bounce()
            
            LoadingDots()
            
            SuccessCheckmark()
            
            DSCard {
                Text("Flip Me!")
                    .headline()
            }
            .flipOnTap()
            
            StaggeredAnimation(items: [1, 2, 3, 4, 5]) { index in
                DSCard {
                    Text("Item \(index + 1)")
                }
            }
        }
        .padding()
        .previewLayout(.sizeThatFits)
    }
}