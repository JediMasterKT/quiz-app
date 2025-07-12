import SwiftUI

// MARK: - Linear Progress Bar
public struct DSLinearProgress: View {
    let progress: Double
    let total: Double
    let showLabel: Bool
    let height: CGFloat
    let backgroundColor: Color
    let progressColor: Color
    let animationDuration: Double
    
    @State private var animatedProgress: Double = 0
    
    public init(
        progress: Double,
        total: Double = 1.0,
        showLabel: Bool = false,
        height: CGFloat = SizeTokens.Height.progressBar,
        backgroundColor: Color = ColorTokens.Surface.tertiary,
        progressColor: Color = ColorTokens.Brand.primary,
        animationDuration: Double = AnimationTokens.Duration.normal
    ) {
        self.progress = progress
        self.total = total
        self.showLabel = showLabel
        self.height = height
        self.backgroundColor = backgroundColor
        self.progressColor = progressColor
        self.animationDuration = animationDuration
    }
    
    private var normalizedProgress: Double {
        min(max(progress / total, 0), 1)
    }
    
    private var progressPercentage: Int {
        Int(normalizedProgress * 100)
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: SpacingTokens.xs) {
            if showLabel {
                HStack {
                    Text("\(progressPercentage)%")
                        .captionBold()
                        .foregroundColor(ColorTokens.Text.secondary)
                    Spacer()
                    Text("\(Int(progress))/\(Int(total))")
                        .caption()
                        .foregroundColor(ColorTokens.Text.tertiary)
                }
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: height / 2)
                        .fill(backgroundColor)
                        .frame(height: height)
                    
                    RoundedRectangle(cornerRadius: height / 2)
                        .fill(progressColor)
                        .frame(width: geometry.size.width * animatedProgress, height: height)
                        .animation(
                            Animation.spring(response: animationDuration, dampingFraction: 0.8),
                            value: animatedProgress
                        )
                }
            }
            .frame(height: height)
            .onAppear {
                animatedProgress = normalizedProgress
            }
            .onChange(of: normalizedProgress) { newValue in
                animatedProgress = newValue
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Progress")
        .accessibilityValue("\(progressPercentage) percent complete")
    }
}

// MARK: - Circular Progress
public struct DSCircularProgress: View {
    let progress: Double
    let total: Double
    let size: CGFloat
    let lineWidth: CGFloat
    let showLabel: Bool
    let backgroundColor: Color
    let progressColor: Color
    let animationDuration: Double
    
    @State private var animatedProgress: Double = 0
    
    public init(
        progress: Double,
        total: Double = 1.0,
        size: CGFloat = 100,
        lineWidth: CGFloat = 8,
        showLabel: Bool = true,
        backgroundColor: Color = ColorTokens.Surface.tertiary,
        progressColor: Color = ColorTokens.Brand.primary,
        animationDuration: Double = AnimationTokens.Duration.normal
    ) {
        self.progress = progress
        self.total = total
        self.size = size
        self.lineWidth = lineWidth
        self.showLabel = showLabel
        self.backgroundColor = backgroundColor
        self.progressColor = progressColor
        self.animationDuration = animationDuration
    }
    
    private var normalizedProgress: Double {
        min(max(progress / total, 0), 1)
    }
    
    private var progressPercentage: Int {
        Int(normalizedProgress * 100)
    }
    
    public var body: some View {
        ZStack {
            Circle()
                .stroke(backgroundColor, lineWidth: lineWidth)
                .frame(width: size, height: size)
            
            Circle()
                .trim(from: 0, to: animatedProgress)
                .stroke(
                    progressColor,
                    style: StrokeStyle(
                        lineWidth: lineWidth,
                        lineCap: .round
                    )
                )
                .frame(width: size, height: size)
                .rotationEffect(.degrees(-90))
                .animation(
                    Animation.spring(response: animationDuration, dampingFraction: 0.8),
                    value: animatedProgress
                )
            
            if showLabel {
                VStack(spacing: SpacingTokens.xxxs) {
                    Text("\(progressPercentage)")
                        .title2()
                        .foregroundColor(ColorTokens.Text.primary)
                    Text("%")
                        .caption()
                        .foregroundColor(ColorTokens.Text.secondary)
                }
            }
        }
        .onAppear {
            animatedProgress = normalizedProgress
        }
        .onChange(of: normalizedProgress) { newValue in
            animatedProgress = newValue
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Progress")
        .accessibilityValue("\(progressPercentage) percent complete")
    }
}

// MARK: - Step Progress Indicator
public struct DSStepProgress: View {
    let currentStep: Int
    let totalSteps: Int
    let stepLabels: [String]?
    let activeColor: Color
    let inactiveColor: Color
    let completedIcon: Image?
    
    public init(
        currentStep: Int,
        totalSteps: Int,
        stepLabels: [String]? = nil,
        activeColor: Color = ColorTokens.Brand.primary,
        inactiveColor: Color = ColorTokens.Surface.tertiary,
        completedIcon: Image? = Image(systemName: "checkmark.circle.fill")
    ) {
        self.currentStep = currentStep
        self.totalSteps = totalSteps
        self.stepLabels = stepLabels
        self.activeColor = activeColor
        self.inactiveColor = inactiveColor
        self.completedIcon = completedIcon
    }
    
    public var body: some View {
        HStack(spacing: SpacingTokens.xs) {
            ForEach(0..<totalSteps, id: \.self) { step in
                if step > 0 {
                    Rectangle()
                        .fill(step < currentStep ? activeColor : inactiveColor)
                        .frame(height: 2)
                        .transition(.scale.combined(with: .opacity))
                }
                
                StepIndicator(
                    step: step + 1,
                    isActive: step < currentStep,
                    isCurrent: step == currentStep,
                    label: stepLabels?[safe: step],
                    activeColor: activeColor,
                    inactiveColor: inactiveColor,
                    completedIcon: completedIcon
                )
            }
        }
        .animation(AnimationTokens.Spring.smooth, value: currentStep)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Progress steps")
        .accessibilityValue("Step \(currentStep + 1) of \(totalSteps)")
    }
}

struct StepIndicator: View {
    let step: Int
    let isActive: Bool
    let isCurrent: Bool
    let label: String?
    let activeColor: Color
    let inactiveColor: Color
    let completedIcon: Image?
    
    var body: some View {
        VStack(spacing: SpacingTokens.xs) {
            ZStack {
                Circle()
                    .fill(isActive || isCurrent ? activeColor : inactiveColor)
                    .frame(width: 32, height: 32)
                
                if isActive, let icon = completedIcon {
                    icon
                        .font(.system(size: 16))
                        .foregroundColor(.white)
                } else {
                    Text("\(step)")
                        .caption()
                        .fontWeight(.semibold)
                        .foregroundColor(isActive || isCurrent ? .white : ColorTokens.Text.secondary)
                }
            }
            .scaleEffect(isCurrent ? 1.2 : 1.0)
            
            if let label = label {
                Text(label)
                    .caption()
                    .foregroundColor(isActive || isCurrent ? ColorTokens.Text.primary : ColorTokens.Text.tertiary)
                    .multilineTextAlignment(.center)
                    .fixedSize()
            }
        }
    }
}

// MARK: - Segmented Progress
public struct DSSegmentedProgress: View {
    let segments: Int
    let filledSegments: Int
    let spacing: CGFloat
    let height: CGFloat
    let activeColor: Color
    let inactiveColor: Color
    
    @State private var animatedSegments: [Bool] = []
    
    public init(
        segments: Int,
        filledSegments: Int,
        spacing: CGFloat = SpacingTokens.xxs,
        height: CGFloat = SizeTokens.Height.progressBar,
        activeColor: Color = ColorTokens.Brand.primary,
        inactiveColor: Color = ColorTokens.Surface.tertiary
    ) {
        self.segments = segments
        self.filledSegments = filledSegments
        self.spacing = spacing
        self.height = height
        self.activeColor = activeColor
        self.inactiveColor = inactiveColor
    }
    
    public var body: some View {
        HStack(spacing: spacing) {
            ForEach(0..<segments, id: \.self) { index in
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(animatedSegments[safe: index] == true ? activeColor : inactiveColor)
                    .frame(height: height)
                    .animation(
                        Animation.spring(response: 0.3, dampingFraction: 0.7)
                            .delay(Double(index) * 0.05),
                        value: animatedSegments[safe: index] ?? false
                    )
            }
        }
        .onAppear {
            animatedSegments = Array(repeating: false, count: segments)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                for i in 0..<filledSegments {
                    if i < segments {
                        animatedSegments[i] = true
                    }
                }
            }
        }
        .onChange(of: filledSegments) { newValue in
            for i in 0..<segments {
                animatedSegments[i] = i < newValue
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Segmented progress")
        .accessibilityValue("\(filledSegments) of \(segments) complete")
    }
}

// MARK: - Loading Spinner
public struct DSLoadingSpinner: View {
    let size: CGFloat
    let color: Color
    let lineWidth: CGFloat
    
    @State private var isAnimating = false
    
    public init(
        size: CGFloat = 40,
        color: Color = ColorTokens.Brand.primary,
        lineWidth: CGFloat = 3
    ) {
        self.size = size
        self.color = color
        self.lineWidth = lineWidth
    }
    
    public var body: some View {
        Circle()
            .trim(from: 0, to: 0.7)
            .stroke(
                color,
                style: StrokeStyle(
                    lineWidth: lineWidth,
                    lineCap: .round
                )
            )
            .frame(width: size, height: size)
            .rotationEffect(.degrees(isAnimating ? 360 : 0))
            .animation(
                Animation.linear(duration: 1)
                    .repeatForever(autoreverses: false),
                value: isAnimating
            )
            .onAppear {
                isAnimating = true
            }
            .accessibilityLabel("Loading")
    }
}

// MARK: - Achievement Progress
public struct DSAchievementProgress: View {
    let title: String
    let progress: Double
    let total: Double
    let icon: Image
    let color: Color
    let isUnlocked: Bool
    
    public init(
        title: String,
        progress: Double,
        total: Double,
        icon: Image,
        color: Color,
        isUnlocked: Bool = false
    ) {
        self.title = title
        self.progress = progress
        self.total = total
        self.icon = icon
        self.color = color
        self.isUnlocked = isUnlocked
    }
    
    public var body: some View {
        HStack(spacing: SpacingTokens.md) {
            ZStack {
                Circle()
                    .fill(isUnlocked ? color : ColorTokens.Surface.tertiary)
                    .frame(width: 48, height: 48)
                
                icon
                    .font(.system(size: 24))
                    .foregroundColor(isUnlocked ? .white : ColorTokens.Text.tertiary)
            }
            .overlay(
                Circle()
                    .stroke(color, lineWidth: 2)
                    .opacity(isUnlocked ? 1 : 0)
            )
            .scaleEffect(isUnlocked ? 1 : 0.9)
            .animation(AnimationTokens.Spring.bouncy, value: isUnlocked)
            
            VStack(alignment: .leading, spacing: SpacingTokens.xxs) {
                Text(title)
                    .headline()
                    .foregroundColor(ColorTokens.Text.primary)
                
                DSLinearProgress(
                    progress: progress,
                    total: total,
                    height: 4,
                    progressColor: color
                )
                
                Text("\(Int(progress))/\(Int(total))")
                    .caption()
                    .foregroundColor(ColorTokens.Text.secondary)
            }
            
            Spacer()
            
            if isUnlocked {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 24))
                    .foregroundColor(color)
                    .transition(.scale.combined(with: .opacity))
            }
        }
        .padding(SpacingTokens.md)
        .background(ColorTokens.Surface.primary)
        .cornerRadius(RadiusTokens.Component.card)
        .shadow(
            color: isUnlocked ? color.opacity(0.3) : ShadowTokens.sm.color,
            radius: isUnlocked ? 12 : ShadowTokens.sm.radius,
            y: isUnlocked ? 6 : ShadowTokens.sm.y
        )
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title) achievement")
        .accessibilityValue("\(Int((progress/total) * 100)) percent complete, \(isUnlocked ? "unlocked" : "locked")")
    }
}

// MARK: - Safe Array Extension
extension Array {
    subscript(safe index: Int) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }
}

// MARK: - Preview
struct DSProgressIndicator_Previews: PreviewProvider {
    static var previews: some View {
        ScrollView {
            VStack(spacing: SpacingTokens.lg) {
                DSLinearProgress(
                    progress: 75,
                    total: 100,
                    showLabel: true
                )
                
                HStack(spacing: SpacingTokens.xl) {
                    DSCircularProgress(
                        progress: 65,
                        total: 100,
                        size: 80
                    )
                    
                    DSCircularProgress(
                        progress: 85,
                        total: 100,
                        size: 100,
                        progressColor: ColorTokens.Semantic.success
                    )
                }
                
                DSStepProgress(
                    currentStep: 2,
                    totalSteps: 4,
                    stepLabels: ["Start", "Middle", "Almost", "Done"]
                )
                
                DSSegmentedProgress(
                    segments: 10,
                    filledSegments: 7
                )
                
                DSLoadingSpinner()
                
                DSAchievementProgress(
                    title: "Quiz Master",
                    progress: 8,
                    total: 10,
                    icon: Image(systemName: "trophy.fill"),
                    color: ColorTokens.Semantic.warning,
                    isUnlocked: false
                )
                
                DSAchievementProgress(
                    title: "Speed Demon",
                    progress: 5,
                    total: 5,
                    icon: Image(systemName: "bolt.fill"),
                    color: ColorTokens.Brand.secondary,
                    isUnlocked: true
                )
            }
            .padding()
        }
    }
}